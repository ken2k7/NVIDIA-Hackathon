"""Scenario / replan engine — the deterministic structured path.

Given a structured Disruption, translate it into solver inputs, re-solve, and
package an old-vs-new ReplanResult with a grounded (numbers-only) explanation.

No AI here. Natural-language parsing (Nemotron, issue #11) and richer grounded
explanations (Nemotron, issue #10) plug in on top of this — the structured path
keeps the demo working even if the AI service is unavailable.

In-memory state only (single-session demo): the "current plan" and any pending
proposals live in module globals, not a database.
"""

import re
import uuid
from typing import Optional

from app.models.schemas import (
    BudgetChange,
    District,
    Disruption,
    Emergency,
    Plan,
    ReplanResult,
    RoadClosure,
    WeatherSlowdown,
    WeatherStoppage,
)
from app.services.optimizer import solve

# ---- in-memory session state -------------------------------------------------

_current_plan: Optional[Plan] = None
_proposals: dict = {}


def get_current_plan(district: District) -> Plan:
    """The baseline plan for this session (solved once, then whatever was approved)."""
    global _current_plan
    if _current_plan is None:
        _current_plan = solve(district)
    return _current_plan


def approve(plan_id: str) -> Optional[Plan]:
    """Promote a pending proposal to the new baseline plan."""
    global _current_plan
    proposal = _proposals.pop(plan_id, None)
    if proposal is not None:
        proposal.status = "approved"
        _current_plan = proposal
    return _current_plan


def reject(plan_id: str) -> Optional[Plan]:
    """Discard a pending proposal; the baseline is unchanged."""
    _proposals.pop(plan_id, None)
    return _current_plan


# ---- disruption -> solver inputs ---------------------------------------------

def _disruption_to_scenario(district: District, d: Disruption):
    """Return (modified_district, blocked_windows) for a disruption.

    blocked_windows is a list of (segment_id | None, from_day, to_day) spans
    during which the affected projects cannot run.
    """
    modified = district.model_copy(deep=True)
    windows = []
    if isinstance(d, RoadClosure):
        windows.append((d.segment_id, 0, d.days))
    elif isinstance(d, BudgetChange):
        modified.total_budget_usd = d.new_cap_usd
    elif isinstance(d, WeatherStoppage):
        windows.append((None, d.from_day, d.to_day))
    elif isinstance(d, WeatherSlowdown):
        lost = round((d.to_day - d.from_day) * d.efficiency_loss_pct / 100)
        windows.append((None, d.from_day, d.from_day + lost))
    elif isinstance(d, Emergency):
        windows.append((d.segment_id, 0, d.duration_days))
    return modified, windows


def _explain(d: Disruption, old: Plan, new: Plan) -> str:
    """A grounded, numbers-only explanation (no invented facts)."""
    def delta(x):
        return f"+{x}" if x >= 0 else f"{x}"

    dt = new.total_days - old.total_days
    dc = new.closure_days - old.closure_days
    kind = d.kind.replace("_", " ")
    return (
        f"Applied a '{kind}' scenario and re-optimised. "
        f"Makespan {delta(dt)} day(s) (now {new.total_days}); "
        f"traffic-weighted closure {delta(dc)} (now {new.closure_days}). "
        f"Dig-once coordination still captures ${new.dig_once_savings_usd:,} and "
        f"{new.dig_once_savings_closure_days} road-days of savings. "
        f"All hard constraints (precedence, crew limits, moratoria, corridors) remain satisfied. "
        f"All figures are pre-tender estimates."
    )


def replan(district: District, disruption: Disruption, old_plan: Optional[Plan] = None) -> ReplanResult:
    if old_plan is None:
        old_plan = get_current_plan(district)
    modified, windows = _disruption_to_scenario(district, disruption)
    try:
        new_plan = solve(modified, blocked_windows=windows)
    except ValueError:
        # The disruption can't coexist with the hard constraints (e.g. it would
        # push a project past its funding deadline). Keep the baseline and say so,
        # rather than returning a 500.
        kind = disruption.kind.replace("_", " ")
        return ReplanResult(
            disruption=disruption,
            old_plan=old_plan,
            new_plan=old_plan,
            explanation=(
                f"The '{kind}' scenario cannot be accommodated without violating a hard "
                f"constraint (a funding deadline, crew limit, or moratorium). No valid "
                f"re-plan exists, so the baseline is kept unchanged. A planner would need "
                f"to relax a deadline or add resources."
            ),
            sources=[],
        )
    new_plan.id = f"plan-{uuid.uuid4().hex[:8]}"
    new_plan.status = "draft"
    _proposals[new_plan.id] = new_plan  # remember it so it can be approved later
    return ReplanResult(
        disruption=disruption,
        old_plan=old_plan,
        new_plan=new_plan,
        explanation=_explain(disruption, old_plan, new_plan),
        sources=[],
    )


# ---- minimal natural-language fallback (keyword-based, AI-free) ---------------

def parse_text(text: str, district: District) -> Disruption:
    """Very small keyword parser so free-text scenarios work without the AI service.

    Nemotron (issue #11) replaces this with real structured extraction.
    """
    t = text.lower()
    seg = next(
        (s for s in district.segments if s.id.lower() in t or s.name.lower() in t),
        district.segments[0],
    )
    m = re.search(r"(\d+)\s*day", t)
    days = int(m.group(1)) if m else 10

    if any(w in t for w in ("rain", "weather", "storm", "flood", "monsoon")):
        return WeatherStoppage(kind="weather_stoppage", from_day=10, to_day=10 + max(5, days))
    if any(w in t for w in ("budget", "cap", "funding", "cut")):
        mb = re.search(r"\$?\s*([\d,]+)\s*(k|m|million|thousand)?", t)
        cap = 8_000_000
        if mb:
            num = float(mb.group(1).replace(",", ""))
            unit = mb.group(2)
            if unit in ("k", "thousand"):
                num *= 1_000
            elif unit in ("m", "million"):
                num *= 1_000_000
            if num > 100_000:
                cap = int(num)
        return BudgetChange(kind="budget_change", new_cap_usd=cap)
    if any(w in t for w in ("emergency", "leak", "gas", "rupture", "urgent", "collapse")):
        return Emergency(kind="emergency", segment_id=seg.id, duration_days=max(5, days), priority="high")
    return RoadClosure(kind="road_closure", segment_id=seg.id, days=days)

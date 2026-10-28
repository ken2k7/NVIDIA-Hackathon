"""Nemotron explanation generation (issue #10) via Nebius Token Factory.

Given the solver's real numbers (old vs new plan + the disruption), produce a
short, plain-English "why this changed" for a non-technical decision-maker.

GROUNDING is the whole point: we hand the model ONLY the computed facts and tell
it to narrate those facts and nothing else — no invented figures. If no Nebius
key is configured, or the call fails for any reason, we fall back to a
deterministic template so the demo never breaks.

NOTE: the live Nemotron call path is UNTESTED here (needs a real Token Factory
key). The fallback path is tested. Confirm the model id in config before relying
on the AI path.
"""

from app.core.config import settings
from app.models.schemas import Disruption, Plan


def _facts(disruption: Disruption, old: Plan, new: Plan) -> dict:
    return {
        "scenario": disruption.kind.replace("_", " "),
        "makespan_before": old.total_days,
        "makespan_after": new.total_days,
        "closure_before": old.closure_days,
        "closure_after": new.closure_days,
        "dig_once_savings_usd": new.dig_once_savings_usd,
        "dig_once_savings_road_days": new.dig_once_savings_closure_days,
        "baseline_kept": new.id == old.id,  # True when the scenario was infeasible
    }


def _template(f: dict) -> str:
    """Deterministic, grounded explanation — the fallback and safety net."""
    if f["baseline_kept"]:
        return (
            f"The '{f['scenario']}' scenario could not be accommodated without breaking a hard "
            f"constraint, so the baseline plan was kept unchanged."
        )
    dt = f["makespan_after"] - f["makespan_before"]
    dc = f["closure_after"] - f["closure_before"]
    sign = lambda x: f"+{x}" if x >= 0 else f"{x}"
    return (
        f"After the '{f['scenario']}' scenario the schedule was re-optimised: the overall timeline "
        f"moved {sign(dt)} day(s) to {f['makespan_after']}, and traffic-weighted road closure moved "
        f"{sign(dc)}. Coordinating shared trenches still saves an estimated "
        f"${f['dig_once_savings_usd']:,} and {f['dig_once_savings_road_days']} road-days. "
        f"All figures are pre-tender estimates."
    )


def explain_plan(disruption: Disruption, old: Plan, new: Plan) -> str:
    """Grounded explanation via Nemotron, falling back to the template on any issue."""
    facts = _facts(disruption, old, new)
    if not settings.nebius_api_key:
        return _template(facts)
    try:
        from openai import OpenAI

        client = OpenAI(base_url=settings.nebius_base_url, api_key=settings.nebius_api_key)
        prompt = (
            "You brief a non-technical city director on a construction-schedule change. "
            "Using ONLY the facts below (never invent numbers), write 2-3 plain sentences on "
            "what changed and why it is acceptable. Describe every cost as 'estimated'.\n\n"
            f"Facts: {facts}"
        )
        resp = client.chat.completions.create(
            model=settings.nebius_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=220,
        )
        text = (resp.choices[0].message.content or "").strip()
        return text or _template(facts)
    except Exception:
        # No package / bad key / network / API error -> deterministic fallback.
        return _template(facts)

"""Deterministic scheduler — turns a District into a Plan using OR-Tools CP-SAT.

This is the full v1 solver (slices 1-3). It respects all six HARD constraints:
  precedence, funding windows, pavement moratorium, crew capacity,
  parallel corridors, and engineering compatibility (incompatible pairs can
  never co-trench).
It DECIDES co-trenching: for each compatible co-location pair a boolean y says
"share one trench", which (a) forces the two digs to start together and (b)
captures that pair's synergy saving. The objective is money-based —

    minimize  total_shift_penalty - total_synergy_captured  (dollars)
              + MAKESPAN_WEIGHT * makespan                   (compactness tie-breaker)

so a pair is co-trenched only when its synergy outweighs the cost of shifting the
jobs together (the "sweet spot" is taken, the "low-synergy trap" is declined).

Dig-once savings are the synergy dollars captured plus, per co-trenched pair, the
shorter dig's road-closure days that no longer close the street separately.

NOTE: MAKESPAN_WEIGHT and the normalized `objective_z` weights are tunables —
revisit them when tuning the demo (see AGENTS.md).
"""

from collections import defaultdict
from dataclasses import dataclass

from ortools.sat.python import cp_model

from app.models.schemas import District, Plan, ScheduledTask

# Dollars that one extra makespan-day "costs" in the objective. Small enough that
# the co-trench economics (tens/hundreds of $k) dominate the schedule shape, big
# enough to break ties toward a compact schedule.
MAKESPAN_WEIGHT = 100


@dataclass
class _Result:
    """Raw output of one solver run (before we package it into a Plan)."""
    starts: dict          # project_id -> start day
    ends: dict            # project_id -> end day
    makespan: int
    synergy_captured: int
    shift_penalty: int
    cotrenched: list      # list of (a, b) pairs actually co-trenched


def _solve_once(district: District, allow_cotrench: bool, blocked_windows=None) -> _Result:
    model = cp_model.CpModel()

    # Horizon: a safe upper bound on the last possible finish day.
    total_duration = sum(p.duration_days for p in district.projects)
    latest_window = max((p.latest_finish_day for p in district.projects), default=0)
    horizon = max(district.deadline_day, latest_window, total_duration)

    # One interval per project (start/end are the decision variables).
    starts, ends, intervals = {}, {}, {}
    for p in district.projects:
        s = model.NewIntVar(0, horizon, f"start_{p.id}")
        e = model.NewIntVar(0, horizon, f"end_{p.id}")
        intervals[p.id] = model.NewIntervalVar(s, p.duration_days, e, f"iv_{p.id}")
        starts[p.id], ends[p.id] = s, e

    segment_by_id = {seg.id: seg for seg in district.segments}

    for p in district.projects:
        # Precedence (+ no cure lag in v1).
        for dep_id in p.depends_on:
            model.Add(ends[dep_id] <= starts[p.id])
        # Funding windows.
        if p.earliest_start_day > 0:
            model.Add(starts[p.id] >= p.earliest_start_day)
        if p.latest_finish_day > 0:
            model.Add(ends[p.id] <= p.latest_finish_day)
        # Moratorium: a cut (excavation) can't start before fresh pavement reopens.
        seg = segment_by_id.get(p.segment_id)
        if seg and seg.moratorium_until_day > 0 and p.crew_type == "excavation":
            model.Add(starts[p.id] >= seg.moratorium_until_day)

    # Crew capacity.
    for crew in district.crews:
        members = [p for p in district.projects if p.crew_type == crew.type]
        if members:
            model.AddCumulative(
                [intervals[p.id] for p in members],
                [p.crews_needed for p in members],
                crew.capacity,
            )

    # Parallel corridors: work on two DIFFERENT segments of the same corridor
    # group can't overlap (jobs on the SAME segment still may — co-trench case).
    corridors = defaultdict(list)
    for p in district.projects:
        seg = segment_by_id.get(p.segment_id)
        if seg and seg.corridor_group:
            corridors[seg.corridor_group].append(p)
    for members in corridors.values():
        for i, a in enumerate(members):
            for b in members[i + 1:]:
                if a.segment_id != b.segment_id:
                    model.AddNoOverlap([intervals[a.id], intervals[b.id]])

    # Disruption windows (from a replan scenario): forbid affected projects from
    # running during [start, end). seg_id=None means all segments (e.g. weather).
    for (seg_id, w_start, w_end) in (blocked_windows or []):
        w_start = max(0, w_start)
        w_end = min(horizon, w_end)
        if w_end <= w_start:
            continue
        window = model.NewIntervalVar(w_start, w_end - w_start, w_end, f"block_{seg_id}_{w_start}")
        for p in district.projects:
            if seg_id is None or p.segment_id == seg_id:
                model.AddNoOverlap([intervals[p.id], window])

    # Co-trenching: a boolean per COMPATIBLE pair. Incompatible pairs get no
    # variable, so they can never capture synergy (engineering-incompat edge case).
    cotrench = []            # (a, b, y)
    synergy_terms = []       # dollars captured
    synergy_by_pair = {}
    for c in district.colocations:
        synergy_by_pair[(c.project_a, c.project_b)] = c.synergy_cost_usd
        if c.compatible and allow_cotrench:
            y = model.NewBoolVar(f"y_{c.project_a}_{c.project_b}")
            # Co-trenched => the two digs start on the same day (one shared trench).
            model.Add(starts[c.project_a] == starts[c.project_b]).OnlyEnforceIf(y)
            cotrench.append((c.project_a, c.project_b, y))
            synergy_terms.append(c.synergy_cost_usd * y)

    # Shift penalty: |start - target| * cost_per_day, summed over projects.
    shift_terms = []
    for p in district.projects:
        if p.shift_cost_per_day > 0 and p.target_start_day > 0:
            dev = model.NewIntVar(0, horizon, f"dev_{p.id}")
            model.AddAbsEquality(dev, starts[p.id] - p.target_start_day)
            shift_terms.append(p.shift_cost_per_day * dev)

    makespan = model.NewIntVar(0, horizon, "makespan")
    model.AddMaxEquality(makespan, [ends[p.id] for p in district.projects])

    model.Minimize(sum(shift_terms) - sum(synergy_terms) + MAKESPAN_WEIGHT * makespan)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0
    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise ValueError(f"No feasible schedule (status {solver.StatusName(status)})")

    start_vals = {p.id: solver.Value(starts[p.id]) for p in district.projects}
    end_vals = {p.id: solver.Value(ends[p.id]) for p in district.projects}
    cotrenched = [(a, b) for (a, b, y) in cotrench if solver.Value(y) == 1]
    synergy_captured = sum(synergy_by_pair[(a, b)] for (a, b) in cotrenched)
    shift_penalty = sum(
        p.shift_cost_per_day * abs(start_vals[p.id] - p.target_start_day)
        for p in district.projects
        if p.shift_cost_per_day > 0 and p.target_start_day > 0
    )
    return _Result(
        starts=start_vals,
        ends=end_vals,
        makespan=solver.Value(makespan),
        synergy_captured=int(synergy_captured),
        shift_penalty=int(shift_penalty),
        cotrenched=cotrenched,
    )


def _closure(district: District, starts: dict, ends: dict) -> tuple[int, int]:
    """Return (traffic-weighted closure days, raw closure days) for a schedule.

    A segment is "closed" on any day a project on it is active. We take the UNION
    of its projects' days so co-trenched overlaps aren't double-counted.
    """
    proj_seg = {p.id: p.segment_id for p in district.projects}
    seg_days: dict = defaultdict(set)
    for pid in starts:
        for day in range(starts[pid], ends[pid]):
            seg_days[proj_seg[pid]].add(day)
    tw = {seg.id: seg.traffic_weight for seg in district.segments}
    weighted = int(sum(len(days) * tw.get(sid, 0) for sid, days in seg_days.items()))
    raw = int(sum(len(days) for days in seg_days.values()))
    return weighted, raw


def solve(district: District, blocked_windows=None) -> Plan:
    coord = _solve_once(district, allow_cotrench=True, blocked_windows=blocked_windows)
    coord_closure, _ = _closure(district, coord.starts, coord.ends)

    # Road-closure days saved by sharing a trench: for each co-trenched pair, the
    # shorter dig's days no longer close the street separately.
    dur = {p.id: p.duration_days for p in district.projects}
    closure_days_saved = sum(min(dur[a], dur[b]) for (a, b) in coord.cotrenched)

    # Which project shares a trench with which (for the timeline's 🔗 markers).
    shared: dict = {}
    for (a, b) in coord.cotrenched:
        shared[a], shared[b] = b, a

    tasks = [
        ScheduledTask(
            project_id=p.id,
            start_day=coord.starts[p.id],
            end_day=coord.ends[p.id],
            shared_trench_with=shared.get(p.id),
        )
        for p in district.projects
    ]

    # Normalized objective score (for display). Weights are all 1 for now.
    z = (
        coord.makespan / district.deadline_day
        - coord.synergy_captured / district.total_budget_usd
        + coord.shift_penalty / district.total_budget_usd
        + coord_closure / district.max_closure
    )

    return Plan(
        id="plan-cpsat-v1",
        status="draft",
        tasks=tasks,
        total_days=coord.makespan,
        closure_days=coord_closure,
        synergy_captured_usd=coord.synergy_captured,
        shift_penalty_usd=coord.shift_penalty,
        dig_once_savings_usd=coord.synergy_captured,                 # vs 0-synergy baseline
        dig_once_savings_closure_days=closure_days_saved,            # road-days saved by co-trenching
        objective_z=round(z, 4),
    )

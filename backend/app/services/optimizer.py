"""Deterministic scheduler — turns a District into a Plan using OR-Tools CP-SAT.

Slice 1: produce ANY valid schedule that respects the hard constraints
(precedence, funding windows, pavement moratorium, crew capacity) and finishes
as early as possible (minimize makespan). Parallel corridors, co-trenching, and
the full normalized objective (Z) come in later slices.
"""

from ortools.sat.python import cp_model

from app.models.schemas import District, Plan, ScheduledTask


def solve(district: District) -> Plan:
    model = cp_model.CpModel()

    # 1. Horizon: a safe upper bound on the last day anything could finish.
    #    (The latest allowed finish, or everything done back-to-back — whichever is larger.)
    total_duration = sum(p.duration_days for p in district.projects)
    latest_window = max((p.latest_finish_day for p in district.projects), default=0)
    horizon = max(district.deadline_day, latest_window, total_duration)

    # 2. One interval per project. `start` and `end` are the DECISION VARIABLES
    #    the solver fills in; the interval ties them together with the duration.
    starts, ends, intervals = {}, {}, {}
    for p in district.projects:
        start = model.NewIntVar(0, horizon, f"start_{p.id}")
        end = model.NewIntVar(0, horizon, f"end_{p.id}")
        interval = model.NewIntervalVar(start, p.duration_days, end, f"iv_{p.id}")
        starts[p.id], ends[p.id], intervals[p.id] = start, end, interval

    segment_by_id = {s.id: s for s in district.segments}

    for p in district.projects:
        # 3. Precedence: every dependency must finish before p starts.
        for dep_id in p.depends_on:
            model.Add(ends[dep_id] <= starts[p.id])

        # 4. Funding windows (0 means "no bound").
        if p.earliest_start_day > 0:
            model.Add(starts[p.id] >= p.earliest_start_day)
        if p.latest_finish_day > 0:
            model.Add(ends[p.id] <= p.latest_finish_day)

        # 5. Moratorium: a cut (excavation) can't start before the fresh pavement reopens.
        seg = segment_by_id.get(p.segment_id)
        if seg and seg.moratorium_until_day > 0 and p.crew_type == "excavation":
            model.Add(starts[p.id] >= seg.moratorium_until_day)

    # 6. Crew capacity: at any moment, overlapping jobs of one crew type can't
    #    demand more crews than that pool has.
    for crew in district.crews:
        members = [p for p in district.projects if p.crew_type == crew.type]
        if members:
            model.AddCumulative(
                [intervals[p.id] for p in members],
                [p.crews_needed for p in members],
                crew.capacity,
            )

    # 7. Makespan = the latest finish day across all projects. Minimize it.
    makespan = model.NewIntVar(0, horizon, "makespan")
    model.AddMaxEquality(makespan, [ends[p.id] for p in district.projects])
    model.Minimize(makespan)

    # 8. Solve (cap the search at 10s so a pathological input can't hang the API).
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0
    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise ValueError(
            f"No feasible schedule found (solver status: {solver.StatusName(status)})"
        )

    # 9. Read the solver's answers back out into a Plan.
    tasks = [
        ScheduledTask(
            project_id=p.id,
            start_day=solver.Value(starts[p.id]),
            end_day=solver.Value(ends[p.id]),
            shared_trench_with=None,  # co-trenching comes in a later slice
        )
        for p in district.projects
    ]
    return Plan(
        id="plan-cpsat-v1",
        status="draft",
        tasks=tasks,
        total_days=solver.Value(makespan),
        closure_days=0,              # these come in later slices
        synergy_captured_usd=0,
        shift_penalty_usd=0,
        dig_once_savings_usd=0,
        dig_once_savings_closure_days=0,
        objective_z=0.0,
    )

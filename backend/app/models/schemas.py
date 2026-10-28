"""Data shapes for the API — the shared "contract" between backend and frontend.

A Pydantic "BaseModel" describes exactly what fields an object has and their
types (mirrored in frontend/src/types.ts). Pydantic validates real data against
these shapes at runtime; FastAPI uses them to validate requests and shape JSON.

Vocabulary (agreed with Bhavya):
  * District = the whole portfolio of works in one area (the container).
  * Project  = ONE construction job to be scheduled (what Bhavya calls PRJ_xx).

Runtime: written to run on Python 3.9+ (uses typing.Optional/Union, not `X | Y`).
Once everyone is on 3.11+ we can switch to the shorter `X | Y` / `list[...]` forms.
"""

from typing import Annotated, List, Literal, Optional, Union

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Static inputs
# ---------------------------------------------------------------------------

class Segment(BaseModel):
    """A stretch of street that work happens on."""
    id: str
    name: str
    coords: List[List[float]]              # [[lat, lng], ...] — polyline for the map
    traffic_weight: float                  # 0–100: how costly it is to close this street
    moratorium_until_day: int = 0          # no pavement cut allowed before this day (0 = none)
    corridor_group: Optional[str] = None   # same group = parallel routes (can't all close at once)


class Project(BaseModel):
    """One construction job to be scheduled (e.g. 'replace the water main')."""
    id: str
    name: str
    utility: Literal["road", "drainage", "water", "fiber"]
    segment_id: str
    duration_days: int
    cost_estimate_usd: int                 # pre-tender engineer's ESTIMATE, not a final price
    crew_type: str                         # which resource pool it draws from
    crews_needed: int
    depends_on: List[str] = []             # ids of projects that must finish first
    earliest_start_day: int = 0            # funding window start (0 = anytime)
    latest_finish_day: int = 0             # funding/deadline window end (0 = none)
    target_start_day: int = 0              # preferred start; moving away costs a shift penalty
    shift_cost_per_day: int = 0            # $ per day moved off target_start_day


class Crew(BaseModel):
    """A resource pool. 'capacity' = how many jobs of this type can run at once."""
    type: str
    capacity: int


class CoLocation(BaseModel):
    """A precomputed 'these two projects could share one trench' pair."""
    project_a: str
    project_b: str
    compatible: bool                       # do engineering/separation codes allow co-trenching?
    synergy_cost_usd: int                  # $ saved if they ARE co-trenched (one dig, not two)


# ---------------------------------------------------------------------------
# Solver output
# ---------------------------------------------------------------------------

class ScheduledTask(BaseModel):
    """One line of the optimizer's schedule."""
    project_id: str
    start_day: int
    end_day: int
    shared_trench_with: Optional[str] = None   # id of the co-trenched project, or null


class Plan(BaseModel):
    """A complete schedule plus its headline numbers."""
    id: str
    status: Literal["draft", "approved", "rejected"]
    tasks: List[ScheduledTask]
    total_days: int                        # makespan (the 'duration' term)
    closure_days: int                      # Σ traffic-weighted segment-closure days
    synergy_captured_usd: int              # total co-trench savings actually captured
    shift_penalty_usd: int                 # total shift penalties paid
    dig_once_savings_usd: int              # vs the uncoordinated baseline
    dig_once_savings_closure_days: int
    objective_z: float                     # the normalized score the solver minimized


# ---------------------------------------------------------------------------
# The whole district the frontend draws
# ---------------------------------------------------------------------------

class District(BaseModel):
    segments: List[Segment]
    projects: List[Project]
    crews: List[Crew]
    colocations: List[CoLocation]
    total_budget_usd: int                  # programme envelope; normalizes the money term
    deadline_day: int                      # hard 'finish by' deadline; normalizes the duration term
    max_closure: int                       # worst-case closure-days; normalizes the disruption term
    plan: Optional[Plan] = None            # computed by the solver (absent in the raw dataset)


# ---------------------------------------------------------------------------
# Disruptions — a "tagged union": the "kind" field decides which shape it is
# ---------------------------------------------------------------------------

class RoadClosure(BaseModel):
    kind: Literal["road_closure"]
    segment_id: str
    days: int


class BudgetChange(BaseModel):
    kind: Literal["budget_change"]
    new_cap_usd: int


class WeatherStoppage(BaseModel):
    kind: Literal["weather_stoppage"]
    from_day: int
    to_day: int


class WeatherSlowdown(BaseModel):
    kind: Literal["weather_slowdown"]
    from_day: int
    to_day: int
    efficiency_loss_pct: int               # 0–100


class Emergency(BaseModel):
    kind: Literal["emergency"]
    segment_id: str
    duration_days: int
    priority: Literal["high", "medium", "low"]


Disruption = Annotated[
    Union[RoadClosure, BudgetChange, WeatherStoppage, WeatherSlowdown, Emergency],
    Field(discriminator="kind"),
]


# ---------------------------------------------------------------------------
# Replan result (returned by POST /replan)
# ---------------------------------------------------------------------------

class SourceCitation(BaseModel):
    title: str
    url: str


class ReplanResult(BaseModel):
    disruption: Disruption
    old_plan: Plan
    new_plan: Plan
    explanation: str
    sources: List[SourceCitation] = []

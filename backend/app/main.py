"""InfraSync backend — application entry point.

Endpoints:
  GET  /health                 -> liveness check
  GET  /project                -> the full validated district dataset
  GET  /plan                   -> the current baseline schedule (CP-SAT)
  POST /replan                 -> apply a disruption, re-solve, return old-vs-new
  POST /plans/{id}/approve     -> promote a proposed plan to the baseline
  POST /plans/{id}/reject      -> discard a proposed plan

Run it from the backend/ folder with:
  uvicorn app.main:app --reload --port 8000
"""

from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import TypeAdapter

from app.core.config import settings
from app.models.schemas import District, Disruption, Plan, ReplanResult
from app.services.dataset import load_district
from app.services.optimizer import solve
from app.services import scenario

app = FastAPI(title="InfraSync API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Parses a raw JSON body into the correct Disruption variant (by its "kind").
_disruption_adapter = TypeAdapter(Disruption)


@app.get("/health")
def health():
    """Liveness check."""
    return {"status": "ok"}


@app.get("/project", response_model=District)
def get_project():
    """Return the full synthetic district (segments, projects, crews, co-locations)."""
    return load_district()


@app.get("/plan", response_model=Plan)
def get_plan():
    """Return the current baseline schedule (solving it once if needed)."""
    return scenario.get_current_plan(load_district())


@app.post("/replan", response_model=ReplanResult)
def post_replan(body: dict = Body(...)):
    """Apply a disruption and return the old plan, the re-optimised plan, and why.

    Body is either a structured disruption ({"kind": "road_closure", ...}) or a
    free-text scenario ({"text": "Main St is flooded for 2 weeks"}).
    """
    district = load_district()
    try:
        if "text" in body:
            disruption = scenario.parse_text(body["text"], district)
        else:
            disruption = _disruption_adapter.validate_python(body)
    except Exception as exc:  # malformed body
        raise HTTPException(status_code=422, detail=f"Could not parse disruption: {exc}")
    return scenario.replan(district, disruption)


@app.post("/plans/{plan_id}/approve")
def post_approve(plan_id: str):
    """Make a proposed plan the new baseline."""
    plan = scenario.approve(plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="No current plan")
    return {"status": "approved", "plan_id": plan.id, "plan": plan}


@app.post("/plans/{plan_id}/reject")
def post_reject(plan_id: str):
    """Discard a proposed plan; the baseline is unchanged."""
    plan = scenario.reject(plan_id)
    return {"status": "rejected", "plan_id": plan.id if plan else None}

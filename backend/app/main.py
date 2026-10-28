"""InfraSync backend — application entry point.

Endpoints:
  GET /health   -> a simple "am I alive?" check
  GET /project  -> the full validated district dataset (from district.json)
  GET /plan     -> the CP-SAT solver's schedule for that district

Run it from the backend/ folder with:
  uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.models.schemas import District, Plan
from app.services.dataset import load_district
from app.services.optimizer import solve

# The application object. "title" shows up in the auto-generated docs page.
app = FastAPI(title="InfraSync API")

# Allow our frontend (running on a different port) to call this backend.
# Without this, the browser blocks the request with a "CORS" error.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],   # allow GET, POST, etc.
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Liveness check. Returns a tiny JSON object so we can confirm the server runs."""
    return {"status": "ok"}


@app.get("/project", response_model=District)
def get_project():
    """Return the full synthetic district: segments, projects, crews, co-locations.

    'plan' is null here — use /plan to compute the schedule.
    """
    return load_district()


@app.get("/plan", response_model=Plan)
def get_plan():
    """Run the deterministic CP-SAT solver on the district and return the schedule."""
    return solve(load_district())

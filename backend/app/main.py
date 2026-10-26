"""InfraSync backend — application entry point.

This creates the FastAPI app and defines:
  GET /health   -> a simple "am I alive?" check
  GET /project  -> the full validated district dataset (loaded from district.json)

Run it from the backend/ folder with:
  uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.models.schemas import District
from app.services.dataset import load_district

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

    'plan' is null here — the deterministic solver (issue #2) will compute and
    attach the schedule later. 'response_model=District' makes FastAPI validate
    the output against our schema before sending it.
    """
    return load_district()

"""InfraSync backend — application entry point.

This creates the FastAPI app and defines two endpoints:
  GET /health   -> a simple "am I alive?" check
  GET /project  -> hardcoded sample data (a stub we'll replace with real logic)

Run it from the backend/ folder with:
  uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.models.schemas import Project, Segment, WorkPackage

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


@app.get("/project", response_model=Project)
def get_project():
    """Return a hardcoded sample project.

    This is a STUB: the data is fixed for now. Later, this will build the real
    project (street network + work packages) instead of this fixed example.
    'response_model=Project' makes FastAPI validate the output against our schema.
    """
    return Project(
        segments=[
            Segment(id="s1", name="Main Street"),
        ],
        packages=[
            WorkPackage(
                id="wp-1",
                name="Replace water main",
                utility="water",
                segment_id="s1",
                duration_days=14,
            ),
            WorkPackage(
                id="wp-2",
                name="Lay fiber conduit",
                utility="fiber",
                segment_id="s1",
                duration_days=5,
            ),
        ],
    )

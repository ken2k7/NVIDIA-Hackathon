"""Data shapes for the API.

A Pydantic "BaseModel" is like the TypeScript interfaces in learn/01: it
describes exactly what fields an object has and their types. FastAPI uses
these to validate incoming data and to shape the JSON it sends back.

Kept intentionally tiny for the scaffold — we'll grow these later.
"""

from typing import List

from pydantic import BaseModel


class Segment(BaseModel):
    """A stretch of street that work happens on."""
    id: str
    name: str


class WorkPackage(BaseModel):
    """One job to be scheduled (e.g. 'replace the water main')."""
    id: str
    name: str
    utility: str          # "water" | "drainage" | "fiber" | "road" (just a string for now)
    segment_id: str       # which Segment this job sits on
    duration_days: int


class Project(BaseModel):
    """Everything the frontend needs to draw the starting picture."""
    segments: List[Segment]
    packages: List[WorkPackage]

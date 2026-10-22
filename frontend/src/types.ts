// Data shapes shared across the frontend. These MUST match the backend's
// Pydantic schemas (backend/app/models/schemas.py) field-for-field, because
// the backend sends JSON in exactly this shape.

export interface Segment {
  id: string;
  name: string;
}

export interface WorkPackage {
  id: string;
  name: string;
  utility: string; // "water" | "fiber" | ... (plain string for now)
  segment_id: string; // matches the backend's snake_case JSON key
  duration_days: number;
}

export interface Project {
  segments: Segment[];
  packages: WorkPackage[];
}

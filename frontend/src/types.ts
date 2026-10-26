// Data shapes shared across the frontend. These MUST match the backend's
// Pydantic schemas (backend/app/models/schemas.py) field-for-field, because
// the backend sends JSON in exactly this shape. JSON keys are snake_case.
//
// Vocabulary: District = the whole portfolio (container); Project = one job (PRJ_xx).

export type Utility = "road" | "drainage" | "water" | "fiber";

export interface Segment {
  id: string;
  name: string;
  coords: number[][]; // [[lat, lng], ...] polyline for the map
  traffic_weight: number; // 0–100
  moratorium_until_day: number; // no pavement cut before this day (0 = none)
  corridor_group: string | null; // same group = parallel routes
}

export interface Project {
  id: string;
  name: string;
  utility: Utility;
  segment_id: string;
  duration_days: number;
  cost_estimate_usd: number; // engineer's ESTIMATE, not a final price
  crew_type: string;
  crews_needed: number;
  depends_on: string[]; // ids of projects that must finish first
  earliest_start_day: number; // funding window start (0 = anytime)
  latest_finish_day: number; // funding/deadline window end (0 = none)
  target_start_day: number; // preferred start
  shift_cost_per_day: number; // $ per day moved off target_start_day
}

export interface Crew {
  type: string;
  capacity: number;
}

export interface CoLocation {
  project_a: string;
  project_b: string;
  compatible: boolean;
  synergy_cost_usd: number;
}

export interface ScheduledTask {
  project_id: string;
  start_day: number;
  end_day: number;
  shared_trench_with: string | null;
}

export interface Plan {
  id: string;
  status: "draft" | "approved" | "rejected";
  tasks: ScheduledTask[];
  total_days: number; // makespan
  closure_days: number; // traffic-weighted closure days
  synergy_captured_usd: number;
  shift_penalty_usd: number;
  dig_once_savings_usd: number;
  dig_once_savings_closure_days: number;
  objective_z: number;
}

export interface District {
  segments: Segment[];
  projects: Project[];
  crews: Crew[];
  colocations: CoLocation[];
  total_budget_usd: number;
  deadline_day: number;
  max_closure: number;
  plan: Plan | null; // computed by the solver (null in the raw dataset)
}

// A tagged union: the "kind" field tells you which shape you have.
export type Disruption =
  | { kind: "road_closure"; segment_id: string; days: number }
  | { kind: "budget_change"; new_cap_usd: number }
  | { kind: "weather_stoppage"; from_day: number; to_day: number }
  | { kind: "weather_slowdown"; from_day: number; to_day: number; efficiency_loss_pct: number }
  | { kind: "emergency"; segment_id: string; duration_days: number; priority: "high" | "medium" | "low" };

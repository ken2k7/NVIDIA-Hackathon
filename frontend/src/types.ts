// Data shapes shared across the frontend. These match the backend's
// Pydantic schemas (backend/app/models/schemas.py) field-for-field (using snake_case).
// Fields that may not exist in the initial minimal stub are marked optional.

export interface Segment {
  id: string;
  name: string;
  coords?: [number, number][]; // polyline points for Leaflet map [lat, lng]
  traffic_weight?: number; // 1-10 disruption sensitivity
  moratorium_until_day?: number; // 0 = no restriction
}

export interface WorkPackage {
  id: string;
  name: string;
  utility: "road" | "drainage" | "water" | "fiber" | string;
  segment_id: string;
  duration_days: number;
  cost_usd?: number;
  crew_type?: string;
  crews_needed?: number;
  depends_on?: string[];
  earliest_start_day?: number;
}

export interface Crew {
  type: string;
  capacity: number;
}

export interface CoLocation {
  package_a: string;
  package_b: string;
  compatible: boolean;
  synergy_cost_usd: number;
}

export interface ScheduledTask {
  work_package_id: string;
  start_day: number;
  end_day: number;
  shared_trench_with: string | null;
}

export type PlanStatus = "draft" | "approved" | "rejected";

export interface Plan {
  id: string;
  status: PlanStatus;
  tasks: ScheduledTask[];
  total_cost_usd: number;
  total_days: number;
  closure_days: number;
  dig_once_savings_usd: number;
  dig_once_savings_closure_days: number;
}

export interface Project {
  segments: Segment[];
  packages: WorkPackage[];
  crews?: Crew[];
  colocations?: CoLocation[];
  plan?: Plan | null;
}

export type Disruption =
  | { kind: "road_closure"; segment_id: string; days: number }
  | { kind: "budget_change"; new_cap_usd: number }
  | { kind: "weather"; from_day: number; to_day: number }
  | { kind: "emergency"; segment_id: string; duration_days: number; priority: string };

export interface SourceCitation {
  title: string;
  url: string;
}

export interface ReplanResult {
  disruption: Disruption;
  old_plan: Plan;
  new_plan: Plan;
  explanation: string;
  sources?: SourceCitation[];
}


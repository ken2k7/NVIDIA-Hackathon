import type { Project, Plan, ReplanResult, Disruption } from "../types";

// Offline/demo dataset. Mirrors the canonical backend dataset
// (backend/data/district.json) so demo mode shows the SAME Manhattan district
// the live API serves. Field names are kept as a superset (new backend names +
// legacy aliases) so existing components render it unchanged.
export const SAMPLE_PROJECT: Project = {
  total_budget_usd: 12000000,
  deadline_day: 300,
  max_closure: 14000,
  segments: [
    { id: "s_main", name: "7th Avenue", traffic_weight: 95, moratorium_until_day: 0, corridor_group: "C1", coords: [[40.755, -73.987], [40.76, -73.983]] },
    { id: "s_broadway", name: "Broadway", traffic_weight: 88, moratorium_until_day: 0, corridor_group: "C1", coords: [[40.756, -73.9858], [40.761, -73.9818]] },
    { id: "s_5th", name: "5th Avenue", traffic_weight: 85, moratorium_until_day: 30, coords: [[40.752, -73.978], [40.757, -73.974]] },
    { id: "s_oak", name: "Park Avenue", traffic_weight: 70, moratorium_until_day: 0, coords: [[40.75, -73.976], [40.755, -73.972]] },
    { id: "s_elm", name: "Lexington Avenue", traffic_weight: 60, moratorium_until_day: 0, coords: [[40.749, -73.97], [40.754, -73.966]] },
    { id: "s_pine", name: "Madison Avenue", traffic_weight: 75, moratorium_until_day: 0, coords: [[40.7505, -73.974], [40.7555, -73.97]] },
  ],
  packages: [
    { id: "PRJ_01", name: "7th Ave Water Main Renewal", utility: "water", segment_id: "s_main", duration_days: 20, cost_estimate_usd: 1200000, cost_usd: 1200000, crew_type: "excavation", crews_needed: 2, depends_on: [], earliest_start_day: 10, latest_finish_day: 120, target_start_day: 15, shift_cost_per_day: 300 },
    { id: "PRJ_02", name: "7th Ave Fiber Conduit", utility: "fiber", segment_id: "s_main", duration_days: 12, cost_estimate_usd: 400000, cost_usd: 400000, crew_type: "excavation", crews_needed: 1, depends_on: [], earliest_start_day: 10, latest_finish_day: 120, target_start_day: 35, shift_cost_per_day: 300 },
    { id: "PRJ_03", name: "7th Ave Repaving", utility: "road", segment_id: "s_main", duration_days: 10, cost_estimate_usd: 800000, cost_usd: 800000, crew_type: "paving", crews_needed: 1, depends_on: ["PRJ_01", "PRJ_02"], earliest_start_day: 0, latest_finish_day: 140, target_start_day: 50, shift_cost_per_day: 500 },
    { id: "PRJ_04", name: "Broadway Water Main", utility: "water", segment_id: "s_broadway", duration_days: 18, cost_estimate_usd: 1000000, cost_usd: 1000000, crew_type: "excavation", crews_needed: 2, depends_on: [], earliest_start_day: 10, latest_finish_day: 120, target_start_day: 18, shift_cost_per_day: 400 },
    { id: "PRJ_05", name: "5th Ave Drainage Upgrade", utility: "drainage", segment_id: "s_5th", duration_days: 14, cost_estimate_usd: 700000, cost_usd: 700000, crew_type: "excavation", crews_needed: 2, depends_on: [], earliest_start_day: 5, latest_finish_day: 120, target_start_day: 10, shift_cost_per_day: 350 },
    { id: "PRJ_06", name: "Park Ave Storm Sewer", utility: "drainage", segment_id: "s_oak", duration_days: 22, cost_estimate_usd: 1500000, cost_usd: 1500000, crew_type: "excavation", crews_needed: 2, depends_on: [], earliest_start_day: 5, latest_finish_day: 50, target_start_day: 15, shift_cost_per_day: 350 },
    { id: "PRJ_07", name: "Park Ave Water Transmission", utility: "water", segment_id: "s_oak", duration_days: 16, cost_estimate_usd: 1300000, cost_usd: 1300000, crew_type: "excavation", crews_needed: 2, depends_on: [], earliest_start_day: 210, latest_finish_day: 265, target_start_day: 225, shift_cost_per_day: 400 },
    { id: "PRJ_08", name: "Lexington Sanitary Sewer", utility: "drainage", segment_id: "s_elm", duration_days: 18, cost_estimate_usd: 1100000, cost_usd: 1100000, crew_type: "excavation", crews_needed: 2, depends_on: [], earliest_start_day: 10, latest_finish_day: 120, target_start_day: 40, shift_cost_per_day: 600 },
    { id: "PRJ_09", name: "Lexington Streetlight Conduit", utility: "fiber", segment_id: "s_elm", duration_days: 6, cost_estimate_usd: 250000, cost_usd: 250000, crew_type: "excavation", crews_needed: 1, depends_on: [], earliest_start_day: 10, latest_finish_day: 120, target_start_day: 85, shift_cost_per_day: 700 },
    { id: "PRJ_10", name: "Madison High-Pressure Water Main", utility: "water", segment_id: "s_pine", duration_days: 16, cost_estimate_usd: 1400000, cost_usd: 1400000, crew_type: "excavation", crews_needed: 2, depends_on: [], earliest_start_day: 90, latest_finish_day: 160, target_start_day: 95, shift_cost_per_day: 450 },
    { id: "PRJ_11", name: "Madison Trunk Sewer", utility: "drainage", segment_id: "s_pine", duration_days: 16, cost_estimate_usd: 1350000, cost_usd: 1350000, crew_type: "excavation", crews_needed: 2, depends_on: [], earliest_start_day: 90, latest_finish_day: 160, target_start_day: 95, shift_cost_per_day: 450 },
  ],
  get projects() {
    return this.packages;
  },
  crews: [
    { type: "excavation", capacity: 4 },
    { type: "paving", capacity: 2 },
  ],
  colocations: [
    { project_a: "PRJ_01", project_b: "PRJ_02", package_a: "PRJ_01", package_b: "PRJ_02", compatible: true, synergy_cost_usd: 115000 },
    { project_a: "PRJ_06", project_b: "PRJ_07", package_a: "PRJ_06", package_b: "PRJ_07", compatible: true, synergy_cost_usd: 140000 },
    { project_a: "PRJ_08", project_b: "PRJ_09", package_a: "PRJ_08", package_b: "PRJ_09", compatible: true, synergy_cost_usd: 4500 },
    { project_a: "PRJ_10", project_b: "PRJ_11", package_a: "PRJ_10", package_b: "PRJ_11", compatible: false, synergy_cost_usd: 160000 },
  ],
  plan: {
    id: "plan-baseline-mh",
    status: "approved",
    total_cost_usd: 11000000,
    total_days: 226,
    closure_days: 165,
    synergy_captured_usd: 115000,
    shift_penalty_usd: 18000,
    dig_once_savings_usd: 115000,
    dig_once_savings_closure_days: 12,
    objective_z: 0.58,
    tasks: [
      { work_package_id: "PRJ_01", project_id: "PRJ_01", start_day: 15, end_day: 35, shared_trench_with: "PRJ_02" },
      { work_package_id: "PRJ_02", project_id: "PRJ_02", start_day: 15, end_day: 27, shared_trench_with: "PRJ_01" },
      { work_package_id: "PRJ_03", project_id: "PRJ_03", start_day: 40, end_day: 50, shared_trench_with: null },
      { work_package_id: "PRJ_04", project_id: "PRJ_04", start_day: 55, end_day: 73, shared_trench_with: null },
      { work_package_id: "PRJ_05", project_id: "PRJ_05", start_day: 30, end_day: 44, shared_trench_with: null },
      { work_package_id: "PRJ_06", project_id: "PRJ_06", start_day: 15, end_day: 37, shared_trench_with: null },
      { work_package_id: "PRJ_07", project_id: "PRJ_07", start_day: 210, end_day: 226, shared_trench_with: null },
      { work_package_id: "PRJ_08", project_id: "PRJ_08", start_day: 40, end_day: 58, shared_trench_with: null },
      { work_package_id: "PRJ_09", project_id: "PRJ_09", start_day: 85, end_day: 91, shared_trench_with: null },
      { work_package_id: "PRJ_10", project_id: "PRJ_10", start_day: 95, end_day: 111, shared_trench_with: null },
      { work_package_id: "PRJ_11", project_id: "PRJ_11", start_day: 111, end_day: 127, shared_trench_with: null },
    ],
  },
};

/**
 * Simulates Nemotron natural-language disruption parsing (Issue #11 / F7).
 * Reads free-form situation text and diagnoses the exact structured disruption.
 */
export function parseSituationWithNemotron(
  text: string,
  project?: Project | null
): Disruption {
  const lower = text.toLowerCase();
  const segments = project?.segments ?? SAMPLE_PROJECT.segments;

  // Extract matching segment ID
  let targetSegmentId = segments[0]?.id ?? "s1";
  for (const seg of segments) {
    if (
      lower.includes(seg.id.toLowerCase()) ||
      lower.includes(seg.name.toLowerCase())
    ) {
      targetSegmentId = seg.id;
      break;
    }
  }

  // Extract numbers (e.g. "14 days", "10 days")
  const daysMatch = lower.match(/(\d+)\s*(?:d|day|days)/);
  const extractedDays = daysMatch ? parseInt(daysMatch[1], 10) : 12;

  // Extract budget amount (e.g. "$450k", "$500,000")
  const budgetMatch = lower.match(/\$?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|m|million|thousand)?/);
  let extractedBudget = 460000;
  if (budgetMatch) {
    let num = parseFloat(budgetMatch[1].replace(/,/g, ""));
    const unit = budgetMatch[2];
    if (unit === "k" || unit === "thousand") num *= 1000;
    if (unit === "m" || unit === "million") num *= 1000000;
    if (num > 50000) extractedBudget = Math.round(num);
  }

  // 1. Weather / Precipitation Diagnosis
  if (
    lower.includes("rain") ||
    lower.includes("weather") ||
    lower.includes("monsoon") ||
    lower.includes("storm") ||
    lower.includes("flood") ||
    lower.includes("precipitation")
  ) {
    return {
      kind: "weather",
      from_day: 10,
      to_day: 10 + Math.max(5, extractedDays),
    };
  }

  // 2. Budget / Fiscal Cap Diagnosis
  if (
    lower.includes("budget") ||
    lower.includes("cap") ||
    lower.includes("funding") ||
    lower.includes("treasury") ||
    lower.includes("cost reduction") ||
    lower.includes("cut")
  ) {
    return {
      kind: "budget_change",
      new_cap_usd: extractedBudget,
    };
  }

  // 3. Emergency / Hazard Diagnosis
  if (
    lower.includes("emergency") ||
    lower.includes("leak") ||
    lower.includes("gas") ||
    lower.includes("rupture") ||
    lower.includes("hazard") ||
    lower.includes("urgent") ||
    lower.includes("collapse")
  ) {
    return {
      kind: "emergency",
      segment_id: targetSegmentId,
      duration_days: Math.max(5, extractedDays),
      priority: "CRITICAL",
    };
  }

  // 4. Road Closure / Blockage Diagnosis (Default fallback)
  return {
    kind: "road_closure",
    segment_id: targetSegmentId,
    days: extractedDays,
  };
}

export function createSimulatedReplan(
  disruption: Disruption,
  currentPlan: Plan
): ReplanResult {
  const isRoadClosure = disruption.kind === "road_closure";
  const daysShift = isRoadClosure ? disruption.days : 6;

  const newPlan: Plan = {
    id: `plan-opt-${Date.now().toString().slice(-4)}`,
    status: "draft",
    total_cost_usd: currentPlan.total_cost_usd + (isRoadClosure ? 18000 : 8000),
    total_days: currentPlan.total_days + daysShift,
    closure_days: currentPlan.closure_days + (isRoadClosure ? 4 : 2),
    dig_once_savings_usd: currentPlan.dig_once_savings_usd + 12000,
    dig_once_savings_closure_days: currentPlan.dig_once_savings_closure_days + 2,
    tasks: currentPlan.tasks.map((task) => {
      // Shift downstream tasks
      if (task.start_day >= 10) {
        return {
          ...task,
          start_day: task.start_day + daysShift,
          end_day: task.end_day + daysShift,
        };
      }
      return task;
    }),
  };

  const explanation =
    disruption.kind === "road_closure"
      ? `OR-Tools CP-SAT re-sequenced work around the ${disruption.days}-day closure on Segment ${disruption.segment_id}. Co-trenching between Water Main (PRJ_01) and Fiber (PRJ_02) was preserved with synchronized excavation windows, increasing dig-once savings to $${newPlan.dig_once_savings_usd.toLocaleString("en-US")} while minimizing overall corridor downtime.`
      : disruption.kind === "weather"
      ? `Severe rain constraint (Days ${disruption.from_day}–${disruption.to_day}) deferred trench excavation on non-stabilized road beds. CP-SAT redistributed crew assignments to indoor utility telemetry, shifting downstream paving to Day 30.`
      : disruption.kind === "budget_change"
      ? `Under the updated $${disruption.new_cap_usd.toLocaleString("en-US")} budget limit, the solver locked co-location synergy windows early to maximize trench-sharing capital reductions before secondary surface work.`
      : `Emergency response protocol accommodated high-priority corridor access while rescheduling non-critical work packages into adjacent non-conflicting time windows.`;

  return {
    disruption,
    old_plan: currentPlan,
    new_plan: newPlan,
    explanation,
    sources: [
      {
        title: "InfraSync CP-SAT Solver v1.0",
        url: "http://localhost:8000/docs",
      },
    ],
  };
}

import type { Project, Plan, ReplanResult, Disruption } from "../types";

export const SAMPLE_PROJECT: Project = {
  segments: [
    {
      id: "s1",
      name: "Main Street",
      traffic_weight: 8,
      moratorium_until_day: 0,
      coords: [
        [37.7749, -122.4194],
        [37.7765, -122.4168],
      ],
    },
    {
      id: "s2",
      name: "2nd Avenue",
      traffic_weight: 6,
      moratorium_until_day: 45,
      coords: [
        [37.7765, -122.4168],
        [37.7788, -122.4132],
      ],
    },
    {
      id: "s3",
      name: "Broadway Blvd",
      traffic_weight: 9,
      moratorium_until_day: 0,
      coords: [
        [37.7788, -122.4132],
        [37.7812, -122.4095],
      ],
    },
    {
      id: "s4",
      name: "Market Way",
      traffic_weight: 7,
      moratorium_until_day: 0,
      coords: [
        [37.7812, -122.4095],
        [37.7835, -122.4061],
      ],
    },
  ],
  packages: [
    {
      id: "wp-1",
      name: "Replace aging water main",
      utility: "water",
      segment_id: "s1",
      duration_days: 14,
      cost_usd: 140000,
      crew_type: "wet_utility",
      crews_needed: 1,
    },
    {
      id: "wp-2",
      name: "Install municipal fiber conduit",
      utility: "fiber",
      segment_id: "s1",
      duration_days: 6,
      cost_usd: 45000,
      crew_type: "telecom",
      crews_needed: 1,
    },
    {
      id: "wp-3",
      name: "Stormwater culvert expansion",
      utility: "drainage",
      segment_id: "s2",
      duration_days: 18,
      cost_usd: 210000,
      crew_type: "heavy_civil",
      crews_needed: 1,
    },
    {
      id: "wp-4",
      name: "Asphalt repaving & curb reconstruction",
      utility: "road",
      segment_id: "s2",
      duration_days: 8,
      cost_usd: 90000,
      crew_type: "paving",
      crews_needed: 1,
      depends_on: ["wp-3"],
    },
    {
      id: "wp-5",
      name: "Smart grid sensor installation",
      utility: "fiber",
      segment_id: "s3",
      duration_days: 5,
      cost_usd: 35000,
      crew_type: "telecom",
      crews_needed: 1,
    },
  ],
  get projects() {
    return this.packages;
  },
  crews: [
    { type: "wet_utility", capacity: 2 },
    { type: "telecom", capacity: 2 },
    { type: "heavy_civil", capacity: 1 },
    { type: "paving", capacity: 2 },
  ],
  colocations: [
    {
      package_a: "wp-1",
      package_b: "wp-2",
      compatible: true,
      synergy_cost_usd: 32000,
    },
  ],
  plan: {
    id: "plan-baseline-001",
    status: "approved",
    total_cost_usd: 488000,
    total_days: 32,
    closure_days: 22,
    dig_once_savings_usd: 32000,
    dig_once_savings_closure_days: 6,
    tasks: [
      {
        work_package_id: "wp-1",
        start_day: 0,
        end_day: 14,
        shared_trench_with: "wp-2",
      },
      {
        work_package_id: "wp-2",
        start_day: 2,
        end_day: 8,
        shared_trench_with: "wp-1",
      },
      {
        work_package_id: "wp-3",
        start_day: 6,
        end_day: 24,
        shared_trench_with: null,
      },
      {
        work_package_id: "wp-4",
        start_day: 24,
        end_day: 32,
        shared_trench_with: null,
      },
      {
        work_package_id: "wp-5",
        start_day: 10,
        end_day: 15,
        shared_trench_with: null,
      },
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
      ? `OR-Tools CP-SAT re-sequenced work around the ${disruption.days}-day closure on Segment ${disruption.segment_id}. Co-trenching between Water Main (wp-1) and Fiber (wp-2) was preserved with synchronized excavation windows, increasing dig-once savings to $${newPlan.dig_once_savings_usd.toLocaleString()} while minimizing overall corridor downtime.`
      : disruption.kind === "weather"
      ? `Severe rain constraint (Days ${disruption.from_day}–${disruption.to_day}) deferred trench excavation on non-stabilized road beds. CP-SAT redistributed crew assignments to indoor utility telemetry, shifting downstream paving to Day 30.`
      : disruption.kind === "budget_change"
      ? `Under the updated $${disruption.new_cap_usd.toLocaleString()} budget limit, the solver locked co-location synergy windows early to maximize trench-sharing capital reductions before secondary surface work.`
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

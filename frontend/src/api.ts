// All the functions that talk to our backend live here, so components don't
// have to know URLs or fetch details — they just call fetchDistrict() or fetchProject().

import type { Disruption, District, Plan, Project, ReplanResult } from "./types";

// Read the backend address from .env.local / Vite env with localhost fallback.
const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

async function handleResponse<T>(res: Response, endpoint: string): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Backend returned ${res.status}`;
    try {
      const data = await res.json();
      if (data && typeof data === "object") {
        if ("detail" in data && typeof data.detail === "string") {
          errorDetail = data.detail;
        } else if ("message" in data && typeof data.message === "string") {
          errorDetail = data.message;
        }
      }
    } catch {
      // Non-JSON error body, use status text
      if (res.statusText) {
        errorDetail = `${res.status} ${res.statusText}`;
      }
    }
    throw new Error(`${endpoint} failed: ${errorDetail}`);
  }
  return (await res.json()) as T;
}

/**
 * Normalizes backend District / Project payload to ensure full compatibility
 * with both the District schema and the Project application state.
 */
function normalizeDistrict(raw: District & { packages?: any[]; projects?: any[] }): Project {
  const pkgs = raw.packages ?? raw.projects ?? [];
  const normalizedTasks = raw.plan?.tasks?.map((t) => ({
    ...t,
    project_id: t.project_id ?? t.work_package_id ?? "",
    work_package_id: t.work_package_id ?? t.project_id ?? "",
  })) ?? [];

  const normalizedColocations = raw.colocations?.map((c) => ({
    ...c,
    project_a: c.project_a ?? c.package_a ?? "",
    project_b: c.project_b ?? c.package_b ?? "",
    package_a: c.package_a ?? c.project_a ?? "",
    package_b: c.package_b ?? c.project_b ?? "",
  })) ?? [];

  const normalizedPlan: Plan | null = raw.plan
    ? {
        ...raw.plan,
        tasks: normalizedTasks,
      }
    : null;

  return {
    ...raw,
    projects: pkgs,
    packages: pkgs,
    colocations: normalizedColocations,
    plan: normalizedPlan,
  };
}

/**
 * Ask the backend for the district data (contract from schemas.py).
 */
export async function fetchDistrict(): Promise<District> {
  const res = await fetch(`${API_URL}/project`);
  const raw = await handleResponse<District>(res, "GET /project");
  return normalizeDistrict(raw);
}

/**
 * Fetch the complete project configuration for the frontend application shell.
 */
export async function fetchProject(): Promise<Project> {
  const district = await fetchDistrict();
  return district as Project;
}

/**
 * Fetch the solver's current coordinated plan.
 */
export async function fetchPlan(): Promise<Plan> {
  const res = await fetch(`${API_URL}/plan`);
  return handleResponse<Plan>(res, "GET /plan");
}

export type ReplanInput = Disruption | { text: string };

/**
 * Request a replan when a disruption occurs.
 * Supports both structured disruption payloads and plain natural-language queries.
 */
export async function requestReplan(input: ReplanInput): Promise<ReplanResult> {
  const res = await fetch(`${API_URL}/replan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return handleResponse<ReplanResult>(res, "POST /replan");
}

export interface ApproveResponse {
  status: string;
  plan_id?: string;
  plan?: Plan;
}

/**
 * Approve a proposed plan, making it the new baseline.
 */
export async function approvePlan(planId: string): Promise<ApproveResponse> {
  // Support both /plans/{id}/approve and fallback /approve
  try {
    const res = await fetch(`${API_URL}/plans/${encodeURIComponent(planId)}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.status === 404) {
      // Fallback endpoint if backend routes as /approve
      const fallbackRes = await fetch(`${API_URL}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      });
      return handleResponse<ApproveResponse>(fallbackRes, "POST /approve");
    }
    return handleResponse<ApproveResponse>(res, `POST /plans/${planId}/approve`);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      const fallbackRes = await fetch(`${API_URL}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      });
      return handleResponse<ApproveResponse>(fallbackRes, "POST /approve");
    }
    throw err;
  }
}

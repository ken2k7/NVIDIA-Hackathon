import { useCallback, useEffect, useState } from "react";
import { approvePlan, fetchPlan, fetchProject, type ReplanInput, requestReplan } from "../api";
import { SAMPLE_PROJECT, createSimulatedReplan, parseSituationWithNemotron } from "../data/sampleDistrict";
import type { Disruption, Plan, Project, ReplanResult } from "../types";

export interface UseProjectReturn {
  project: Project | null;
  plan: Plan | null;
  replan: ReplanResult | null;
  isLoading: boolean;
  isActing: boolean;
  error: string | null;
  actionError: string | null;
  isDemoMode: boolean;
  refreshProject: () => Promise<void>;
  generatePlan: () => Promise<Plan | null>;
  triggerReplan: (input: ReplanInput) => Promise<ReplanResult | null>;
  approveProposal: (planId?: string) => Promise<boolean>;
  rejectProposal: () => void;
  clearActionError: () => void;
  loadDemoMode: () => void;
}

/**
 * Top-level hook managing shared project state, baseline plan, and replan proposals.
 * Provides data-down values and event-up actions for App and child components.
 */
export function useProject(): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [replan, setReplan] = useState<ReplanResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActing, setIsActing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Fetch the project configuration on mount
  useEffect(() => {
    let ignore = false;
    fetchProject()
      .then(async (data) => {
        if (ignore) return;
        setProject(data);
        setIsDemoMode(false);
        // /project returns plan=null (the solver computes it separately), so pull
        // the real baseline schedule from /plan unless it's already included.
        const baseline = data.plan ?? (await fetchPlan().catch(() => null));
        if (!ignore && baseline) {
          setPlan(baseline);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Explicit refresh callable from user interactions
  const refreshProject = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProject();
      setProject(data);
      if (data.plan) {
        setPlan(data.plan);
      }
      setIsDemoMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load rich demo dataset for offline testing and presentations
  const loadDemoMode = useCallback(() => {
    setProject(SAMPLE_PROJECT);
    setPlan(SAMPLE_PROJECT.plan ?? null);
    setReplan(null);
    setError(null);
    setActionError(null);
    setIsDemoMode(true);
    setIsLoading(false);
  }, []);

  // Explicitly fetch or trigger baseline plan generation
  const generatePlan = useCallback(async (): Promise<Plan | null> => {
    setIsActing(true);
    setActionError(null);
    try {
      const fetchedPlan = await fetchPlan();
      setPlan(fetchedPlan);
      return fetchedPlan;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isDemoMode && SAMPLE_PROJECT.plan) {
        setPlan(SAMPLE_PROJECT.plan);
        return SAMPLE_PROJECT.plan;
      }
      setActionError(msg);
      return null;
    } finally {
      setIsActing(false);
    }
  }, [isDemoMode]);

  // Submit a disruption scenario (either structured or natural language prompt)
  const triggerReplan = useCallback(
    async (input: ReplanInput): Promise<ReplanResult | null> => {
      setIsActing(true);
      setActionError(null);
      try {
        const result = await requestReplan(input);
        setReplan(result);
        return result;
      } catch (err) {
        // In demo mode or if backend replan endpoint is pending (404), provide simulated result
        if (isDemoMode || (err instanceof Error && err.message.includes("404"))) {
          const disruption: Disruption =
            "kind" in input
              ? (input as Disruption)
              : parseSituationWithNemotron(
                  (input as { text: string }).text,
                  project
                );
          const basePlan = plan ?? SAMPLE_PROJECT.plan!;
          const simResult = createSimulatedReplan(disruption, basePlan);
          setReplan(simResult);
          return simResult;
        }

        const msg = err instanceof Error ? err.message : String(err);
        setActionError(msg);
        return null;
      } finally {
        setIsActing(false);
      }
    },
    [isDemoMode, plan, project]
  );

  // Approve proposal: promotes new_plan to current plan and notifies backend
  const approveProposal = useCallback(
    async (planId?: string): Promise<boolean> => {
      const targetId = planId ?? replan?.new_plan.id;
      if (!targetId) {
        setActionError("No proposal plan ID available to approve");
        return false;
      }

      setIsActing(true);
      setActionError(null);
      try {
        await approvePlan(targetId);
        if (replan?.new_plan) {
          setPlan({ ...replan.new_plan, status: "approved" });
        }
        setReplan(null);
        return true;
      } catch (err) {
        // Fallback for demo mode or endpoint stubbing
        if (isDemoMode || (err instanceof Error && err.message.includes("404"))) {
          if (replan?.new_plan) {
            setPlan({ ...replan.new_plan, status: "approved" });
          }
          setReplan(null);
          return true;
        }

        const msg = err instanceof Error ? err.message : String(err);
        setActionError(msg);
        return false;
      } finally {
        setIsActing(false);
      }
    },
    [isDemoMode, replan]
  );

  // Reject / discard proposed replan
  const rejectProposal = useCallback(() => {
    setReplan(null);
    setActionError(null);
  }, []);

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  return {
    project,
    plan,
    replan,
    isLoading,
    isActing,
    error,
    actionError,
    isDemoMode,
    refreshProject,
    generatePlan,
    triggerReplan,
    approveProposal,
    rejectProposal,
    clearActionError,
    loadDemoMode,
  };
}

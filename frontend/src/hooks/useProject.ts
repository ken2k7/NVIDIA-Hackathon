import { useCallback, useEffect, useState } from "react";
import { approvePlan, fetchPlan, fetchProject, type ReplanInput, requestReplan } from "../api";
import type { Plan, Project, ReplanResult } from "../types";

export interface UseProjectReturn {
  project: Project | null;
  plan: Plan | null;
  replan: ReplanResult | null;
  isLoading: boolean;
  isActing: boolean;
  error: string | null;
  actionError: string | null;
  refreshProject: () => Promise<void>;
  generatePlan: () => Promise<Plan | null>;
  triggerReplan: (input: ReplanInput) => Promise<ReplanResult | null>;
  approveProposal: (planId?: string) => Promise<boolean>;
  rejectProposal: () => void;
  clearActionError: () => void;
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

  // Fetch the project configuration on mount
  useEffect(() => {
    let ignore = false;
    fetchProject()
      .then((data) => {
        if (!ignore) {
          setProject(data);
          if (data.plan) {
            setPlan(data.plan);
          }
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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
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
      setActionError(msg);
      return null;
    } finally {
      setIsActing(false);
    }
  }, []);

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
        const msg = err instanceof Error ? err.message : String(err);
        setActionError(msg);
        return null;
      } finally {
        setIsActing(false);
      }
    },
    []
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
        const msg = err instanceof Error ? err.message : String(err);
        setActionError(msg);
        return false;
      } finally {
        setIsActing(false);
      }
    },
    [replan]
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
    refreshProject,
    generatePlan,
    triggerReplan,
    approveProposal,
    rejectProposal,
    clearActionError,
  };
}

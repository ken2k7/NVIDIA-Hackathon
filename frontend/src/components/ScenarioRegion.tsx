import React from "react";
import type { Plan, Project, ReplanResult } from "../types";
import type { ReplanInput } from "../api";
import { ScenarioPanel } from "./ScenarioPanel";

interface ScenarioRegionProps {
  project: Project | null;
  plan: Plan | null;
  replan: ReplanResult | null;
  isActing: boolean;
  actionError: string | null;
  onTriggerReplan: (input: ReplanInput) => Promise<ReplanResult | null>;
  onApprove: () => Promise<boolean>;
  onReject: () => void;
  onClearError: () => void;
  children?: React.ReactNode;
}

export const ScenarioRegion: React.FC<ScenarioRegionProps> = ({
  project,
  plan,
  replan,
  isActing,
  actionError,
  onTriggerReplan,
  onApprove,
  onReject,
  onClearError,
  children,
}) => {
  return (
    <section className="shell-region region-scenario" aria-label="Scenario and Replan Panel">
      <div className="region-header">
        <div className="region-title-group">
          <span className="region-icon">⚡</span>
          <h2>Scenario & AI Replan</h2>
        </div>
        <span className={`region-status-pill ${replan ? "warning" : "idle"}`}>
          {replan ? "Proposal Pending" : "Ready"}
        </span>
      </div>

      <div id="scenario-slot" className="region-content scenario-slot">
        {children ? (
          children
        ) : (
          <ScenarioPanel
            project={project}
            plan={plan}
            replan={replan}
            isActing={isActing}
            actionError={actionError}
            onTriggerReplan={onTriggerReplan}
            onApprove={onApprove}
            onReject={onReject}
            onClearError={onClearError}
          />
        )}
      </div>
    </section>
  );
};

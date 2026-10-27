import React from "react";
import type { Plan, Project, ReplanResult } from "../types";
import { GanttChart } from "./GanttChart";

interface TimelineRegionProps {
  project: Project | null;
  plan: Plan | null;
  replan?: ReplanResult | null;
  children?: React.ReactNode;
}

export const TimelineRegion: React.FC<TimelineRegionProps> = ({
  project,
  plan,
  replan,
  children,
}) => {
  const packages = project?.packages ?? [];

  return (
    <section className="shell-region region-timeline" aria-label="Schedule Timeline Region">
      <div className="region-header">
        <div className="region-title-group">
          <span className="region-icon">📊</span>
          <h2>Schedule Timeline & Gantt</h2>
        </div>
        <div className="region-header-meta">
          {plan ? (
            <span className="region-status-pill success">
              Plan #{plan.id} ({plan.total_days} days)
            </span>
          ) : (
            <span className="region-status-pill muted">
              {packages.length} Work Packages
            </span>
          )}
        </div>
      </div>

      <div id="timeline-slot" className="region-content timeline-slot">
        {children ? (
          children
        ) : packages.length > 0 ? (
          <GanttChart project={project} plan={plan} replan={replan} />
        ) : (
          <div className="slot-placeholder timeline-placeholder">
            <div className="placeholder-banner">
              <span className="status-dot green"></span>
              <span>Timeline Slot Ready — Gantt / Schedule View (Issue #8)</span>
            </div>
            <p className="no-segments-hint">No work packages loaded in current project.</p>
          </div>
        )}
      </div>
    </section>
  );
};

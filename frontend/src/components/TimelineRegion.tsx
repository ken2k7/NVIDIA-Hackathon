import React from "react";
import type { Plan, Project } from "../types";

interface TimelineRegionProps {
  project: Project | null;
  plan: Plan | null;
  children?: React.ReactNode;
}

export const TimelineRegion: React.FC<TimelineRegionProps> = ({
  project,
  plan,
  children,
}) => {
  const packages = project?.packages ?? [];

  return (
    <section className="shell-region region-timeline" aria-label="Schedule Timeline Region">
      <div className="region-header">
        <div className="region-title-group">
          <span className="region-icon">📊</span>
          <h2>Schedule Timeline</h2>
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
        ) : (
          <div className="slot-placeholder timeline-placeholder">
            <div className="placeholder-banner">
              <span className="status-dot green"></span>
              <span>Timeline Slot Ready — Gantt / Schedule View (Issue #5)</span>
            </div>

            <div className="work-packages-stream">
              {packages.map((pkg) => (
                <div key={pkg.id} className="package-row">
                  <div className="package-info">
                    <span className={`utility-badge utility-${pkg.utility}`}>
                      {pkg.utility}
                    </span>
                    <span className="package-name">{pkg.name}</span>
                  </div>
                  <div className="package-track">
                    <div
                      className="package-bar-stub"
                      style={{
                        width: `${Math.min(100, Math.max(15, pkg.duration_days * 5))}%`,
                      }}
                    >
                      <span className="bar-label">{pkg.duration_days}d</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

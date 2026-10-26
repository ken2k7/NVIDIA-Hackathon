import React from "react";
import type { Plan, Project } from "../types";

interface HeaderProps {
  project: Project | null;
  plan: Plan | null;
  isActing: boolean;
  isDemoMode?: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  plan,
  isActing,
  isDemoMode = false,
  onRefresh,
}) => {
  const segmentCount = project?.segments.length ?? 0;
  const packageCount = project?.packages.length ?? 0;

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo">
          <span className="logo-symbol">⚡</span>
          <span className="brand-text">InfraSync</span>
        </div>
        <span className="brand-badge">Autonomous Right-of-Way Coordination</span>
      </div>

      <div className="header-metrics">
        <div className="metric-chip">
          <span className="metric-label">Segments:</span>
          <span className="metric-value">{segmentCount}</span>
        </div>
        <div className="metric-chip">
          <span className="metric-label">Work Packages:</span>
          <span className="metric-value">{packageCount}</span>
        </div>
        {plan && (
          <div className="metric-chip highlight">
            <span className="metric-label">Dig-Once Savings:</span>
            <span className="metric-value">${plan.dig_once_savings_usd.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="header-actions">
        <span
          className={`connection-status-badge ${
            isDemoMode ? "badge-demo" : "badge-live"
          }`}
          title={
            isDemoMode
              ? "Running in offline demo mode"
              : "Connected to FastAPI backend"
          }
        >
          <span className={`status-dot ${isDemoMode ? "amber" : "green"}`}></span>
          {isDemoMode ? "Demo Mode" : "FastAPI Live"}
        </span>

        <button
          id="btn-sync-header"
          className="btn-refresh"
          onClick={onRefresh}
          disabled={isActing}
          title="Reload project data from backend"
        >
          {isActing ? "Syncing…" : "↻ Sync"}
        </button>
      </div>
    </header>
  );
};

import React from "react";
import { Header } from "./components/Header";
import { MapRegion } from "./components/MapRegion";
import { TimelineRegion } from "./components/TimelineRegion";
import { ScenarioRegion } from "./components/ScenarioRegion";
import { useProject } from "./hooks/useProject";
import "./App.css";

export default function App(): React.ReactElement {
  const {
    project,
    plan,
    replan,
    isLoading,
    isActing,
    error,
    actionError,
    isDemoMode,
    refreshProject,
    triggerReplan,
    approveProposal,
    rejectProposal,
    clearActionError,
    loadDemoMode,
  } = useProject();

  // Full-page Loading State
  if (isLoading && !project) {
    return (
      <div className="app-loading-screen" role="status" aria-live="polite">
        <div className="loading-spinner"></div>
        <h2>Loading InfraSync…</h2>
        <p>Connecting to backend Right-of-Way service</p>
      </div>
    );
  }

  // Full-page Error State
  if (error && !project) {
    return (
      <div className="app-error-screen" role="alert">
        <div className="error-icon">⚠️</div>
        <h2>Could Not Connect to InfraSync Backend</h2>
        <p className="error-message">{error}</p>
        <p className="error-hint">
          Ensure FastAPI is running on <code>http://localhost:8000</code> with CORS
          enabled.
        </p>
        <div className="error-actions-group">
          <button id="btn-retry" className="btn-retry" onClick={refreshProject}>
            ↻ Retry Connection
          </button>
          <button
            id="btn-demo-mode"
            className="btn-demo-fallback"
            onClick={loadDemoMode}
          >
            ⚡ Launch Demo Offline Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Top Header / Navigation Bar */}
      <Header
        project={project}
        plan={plan}
        isActing={isActing}
        isDemoMode={isDemoMode}
        onRefresh={refreshProject}
      />

      {/* Main 3-Region Grid Layout */}
      <main className="shell-grid">
        {/* Left Primary Column: Spatial & Temporal Coordination */}
        <div className="shell-primary-column">
          {/* Region 1: Map View (Leaflet GIS) */}
          <MapRegion project={project} replan={replan} />

          {/* Region 2: Timeline View (CP-SAT Gantt) */}
          <TimelineRegion project={project} plan={plan} replan={replan} />
        </div>

        {/* Right Secondary Column: Autonomous Simulation & Decision Engine */}
        <div className="shell-secondary-column">
          {/* Region 3: Scenario & AI Replan Panel */}
          <ScenarioRegion
            project={project}
            plan={plan}
            replan={replan}
            isActing={isActing}
            actionError={actionError}
            onTriggerReplan={triggerReplan}
            onApprove={approveProposal}
            onReject={rejectProposal}
            onClearError={clearActionError}
          />
        </div>
      </main>
    </div>
  );
}

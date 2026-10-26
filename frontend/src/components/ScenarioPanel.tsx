import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Check,
  X,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import type { Disruption, Plan, Project, ReplanResult } from "../types";
import type { ReplanInput } from "../api";
import "./ScenarioPanel.css";

export interface ScenarioPanelProps {
  project: Project | null;
  plan: Plan | null;
  replan: ReplanResult | null;
  isActing: boolean;
  actionError: string | null;
  onTriggerReplan: (input: ReplanInput) => Promise<ReplanResult | null>;
  onApprove: () => Promise<boolean>;
  onReject: () => void;
  onClearError: () => void;
}

type TabMode = "presets" | "custom" | "natural";

export const ScenarioPanel: React.FC<ScenarioPanelProps> = ({
  project,
  plan,
  replan,
  isActing,
  actionError,
  onTriggerReplan,
  onApprove,
  onReject,
  onClearError,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>("presets");
  const [promptText, setPromptText] = useState("");

  // Structured custom form state
  const segments = project?.segments ?? [];
  const firstSegmentId = segments[0]?.id ?? "s1";
  const secondSegmentId = segments[1]?.id ?? segments[0]?.id ?? "s2";

  const [customKind, setCustomKind] = useState<
    "road_closure" | "weather" | "budget_change" | "emergency"
  >("road_closure");
  const [selectedSegId, setSelectedSegId] = useState<string>(firstSegmentId);
  const [closureDays, setClosureDays] = useState<number>(14);
  const [weatherFrom, setWeatherFrom] = useState<number>(10);
  const [weatherTo, setWeatherTo] = useState<number>(20);
  const [budgetCap, setBudgetCap] = useState<number>(450000);
  const [emergencyPriority, setEmergencyPriority] = useState<string>("CRITICAL");
  const [emergencyDays, setEmergencyDays] = useState<number>(8);

  const handlePresetTrigger = (disruption: Disruption) => {
    if (isActing) return;
    onTriggerReplan(disruption);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isActing) return;

    let disruption: Disruption;
    if (customKind === "road_closure") {
      disruption = {
        kind: "road_closure",
        segment_id: selectedSegId,
        days: Number(closureDays) || 10,
      };
    } else if (customKind === "weather") {
      disruption = {
        kind: "weather",
        from_day: Number(weatherFrom) || 1,
        to_day: Number(weatherTo) || 10,
      };
    } else if (customKind === "budget_change") {
      disruption = {
        kind: "budget_change",
        new_cap_usd: Number(budgetCap) || 400000,
      };
    } else {
      disruption = {
        kind: "emergency",
        segment_id: selectedSegId,
        duration_days: Number(emergencyDays) || 7,
        priority: emergencyPriority,
      };
    }

    onTriggerReplan(disruption);
  };

  const handleNaturalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isActing) return;
    onTriggerReplan({ text: promptText.trim() });
  };

  // Metric comparisons when replan proposal is active
  const diffDays = replan
    ? replan.new_plan.total_days - replan.old_plan.total_days
    : 0;
  const diffCost = replan
    ? replan.new_plan.total_cost_usd - replan.old_plan.total_cost_usd
    : 0;
  const diffClosure = replan
    ? replan.new_plan.closure_days - replan.old_plan.closure_days
    : 0;
  const diffSavings = replan
    ? replan.new_plan.dig_once_savings_usd - replan.old_plan.dig_once_savings_usd
    : 0;

  return (
    <div className="scenario-panel-root" role="region" aria-label="Scenario Simulation Engine">
      {/* Action Error Dismissible Banner */}
      {actionError && (
        <div className="action-error-banner" role="alert">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={15} />
            <span>{actionError}</span>
          </div>
          <button
            className="btn-dismiss-error"
            onClick={onClearError}
            title="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Proposal View (When Replan is Pending Approval) */}
      {replan ? (
        <div className="results-proposal-card">
          <div className="results-header">
            <div className="results-badge-group">
              <span className="badge-proposal-pending">⚠️ Replan Proposed</span>
              <span className="disruption-badge">
                Scenario: {replan.disruption.kind.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Awaiting Approval
            </span>
          </div>

          {/* 4-Metric Before vs After Comparison Grid */}
          <div className="metrics-comparison-grid">
            {/* 1. Makespan / Total Duration */}
            <div className="metric-card-box">
              <span className="metric-box-title">Total Duration</span>
              <div className="metric-box-values">
                <span className="metric-old-val">{replan.old_plan.total_days}d</span>
                <span className="metric-arrow">→</span>
                <span className="metric-new-val">{replan.new_plan.total_days}d</span>
              </div>
              <span
                className={`metric-delta-tag ${
                  diffDays > 0
                    ? "delta-negative"
                    : diffDays < 0
                    ? "delta-positive"
                    : "delta-neutral"
                }`}
              >
                {diffDays > 0 ? `+${diffDays}d slip` : diffDays < 0 ? `${diffDays}d faster` : "0d change"}
              </span>
            </div>

            {/* 2. Direct Capital Cost */}
            <div className="metric-card-box">
              <span className="metric-box-title">Total Project Cost</span>
              <div className="metric-box-values">
                <span className="metric-old-val">
                  ${(replan.old_plan.total_cost_usd / 1000).toFixed(0)}k
                </span>
                <span className="metric-arrow">→</span>
                <span className="metric-new-val">
                  ${(replan.new_plan.total_cost_usd / 1000).toFixed(0)}k
                </span>
              </div>
              <span
                className={`metric-delta-tag ${
                  diffCost > 0
                    ? "delta-negative"
                    : diffCost < 0
                    ? "delta-positive"
                    : "delta-neutral"
                }`}
              >
                {diffCost > 0
                  ? `+$${(diffCost / 1000).toFixed(0)}k shift cost`
                  : diffCost < 0
                  ? `-$${Math.abs(diffCost / 1000).toFixed(0)}k`
                  : "$0 delta"}
              </span>
            </div>

            {/* 3. Traffic Closure Days */}
            <div className="metric-card-box">
              <span className="metric-box-title">Closure Days</span>
              <div className="metric-box-values">
                <span className="metric-old-val">{replan.old_plan.closure_days}d</span>
                <span className="metric-arrow">→</span>
                <span className="metric-new-val">{replan.new_plan.closure_days}d</span>
              </div>
              <span
                className={`metric-delta-tag ${
                  diffClosure > 0 ? "delta-negative" : "delta-positive"
                }`}
              >
                {diffClosure > 0 ? `+${diffClosure}d road impact` : "0d additional impact"}
              </span>
            </div>

            {/* 4. Dig-Once Co-Trenching Savings */}
            <div className="metric-card-box highlight">
              <span className="metric-box-title">Dig-Once Savings</span>
              <div className="metric-box-values">
                <span className="metric-old-val">
                  ${(replan.old_plan.dig_once_savings_usd / 1000).toFixed(0)}k
                </span>
                <span className="metric-arrow">→</span>
                <span className="metric-new-val highlight">
                  ${(replan.new_plan.dig_once_savings_usd / 1000).toFixed(0)}k
                </span>
              </div>
              <span className="metric-delta-tag delta-positive">
                {diffSavings >= 0
                  ? `+$${(diffSavings / 1000).toFixed(0)}k synergy preserved`
                  : `-$${Math.abs(diffSavings / 1000).toFixed(0)}k`}
              </span>
            </div>
          </div>

          {/* NVIDIA Nemotron AI Reasoning Synthesis (Issue #10 Slot) */}
          <div className="nemotron-explanation-card">
            <div className="nemotron-badge-header">
              <span className="nemotron-pill">
                <Sparkles size={12} />
                NVIDIA Nemotron Reasoning Synthesis
              </span>
              <span style={{ fontSize: 10, color: "var(--accent-purple)", fontWeight: 600 }}>
                Grounded Solver Facts
              </span>
            </div>
            <p className="nemotron-text">{replan.explanation}</p>

            {replan.sources && replan.sources.length > 0 && (
              <div className="nemotron-sources-list">
                <span>Citations:</span>
                {replan.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="source-link"
                  >
                    [{i + 1}] {src.title}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Decision Controls Bar */}
          <div className="decision-controls-bar">
            <button
              id="btn-approve-replan"
              className="btn-approve-plan"
              disabled={isActing}
              onClick={onApprove}
            >
              <Check size={16} />
              <span>{isActing ? "Committing Plan…" : "Approve & Set Baseline"}</span>
            </button>
            <button
              id="btn-reject-replan"
              className="btn-reject-plan"
              disabled={isActing}
              onClick={onReject}
            >
              <X size={15} />
              <span>Discard</span>
            </button>
          </div>
        </div>
      ) : (
        /* Scenario Trigger & Input Forms (When no proposal is active) */
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Mode Tabs */}
          <div className="scenario-nav-tabs">
            <button
              className={`scenario-nav-tab ${activeTab === "presets" ? "active" : ""}`}
              onClick={() => setActiveTab("presets")}
            >
              <Zap size={13} />
              <span>Presets</span>
            </button>
            <button
              className={`scenario-nav-tab ${activeTab === "custom" ? "active" : ""}`}
              onClick={() => setActiveTab("custom")}
            >
              <SlidersHorizontal size={13} />
              <span>Custom Builder</span>
            </button>
            <button
              className={`scenario-nav-tab ${activeTab === "natural" ? "active" : ""}`}
              onClick={() => setActiveTab("natural")}
            >
              <Sparkles size={13} />
              <span>Nemotron AI</span>
            </button>
          </div>

          {/* Tab 1: Quick Preset Buttons */}
          {activeTab === "presets" && (
            <div className="presets-grid">
              <button
                className="scenario-card-btn"
                disabled={isActing}
                onClick={() =>
                  handlePresetTrigger({
                    kind: "road_closure",
                    segment_id: firstSegmentId,
                    days: 14,
                  })
                }
              >
                <div className="scenario-card-info">
                  <span className="scenario-card-title">
                    🚧 14-Day Emergency Closure ({firstSegmentId})
                  </span>
                  <span className="scenario-card-desc">
                    Unplanned sinkhole forces complete right-of-way closure
                  </span>
                </div>
                <span className="scenario-card-tag">Closure</span>
              </button>

              <button
                className="scenario-card-btn"
                disabled={isActing}
                onClick={() =>
                  handlePresetTrigger({
                    kind: "weather",
                    from_day: 10,
                    to_day: 20,
                  })
                }
              >
                <div className="scenario-card-info">
                  <span className="scenario-card-title">
                    🌧️ Severe Rain & Flood Window (Day 10–20)
                  </span>
                  <span className="scenario-card-desc">
                    Deep excavation halted due to ground saturation risk
                  </span>
                </div>
                <span className="scenario-card-tag">Weather</span>
              </button>

              <button
                className="scenario-card-btn"
                disabled={isActing}
                onClick={() =>
                  handlePresetTrigger({
                    kind: "budget_change",
                    new_cap_usd: 460000,
                  })
                }
              >
                <div className="scenario-card-info">
                  <span className="scenario-card-title">
                    💰 Emergency $460k Capital Budget Cap
                  </span>
                  <span className="scenario-card-desc">
                    Treasury reduction forces maximum co-trenching synergy
                  </span>
                </div>
                <span className="scenario-card-tag">Fiscal</span>
              </button>

              <button
                className="scenario-card-btn"
                disabled={isActing}
                onClick={() =>
                  handlePresetTrigger({
                    kind: "emergency",
                    segment_id: secondSegmentId,
                    duration_days: 8,
                    priority: "CRITICAL",
                  })
                }
              >
                <div className="scenario-card-info">
                  <span className="scenario-card-title">
                    🚨 Gas Leak Priority Excavation ({secondSegmentId})
                  </span>
                  <span className="scenario-card-desc">
                    High-priority hazard requires immediate corridor priority
                  </span>
                </div>
                <span className="scenario-card-tag">Hazard</span>
              </button>
            </div>
          )}

          {/* Tab 2: Structured Custom Builder Form */}
          {activeTab === "custom" && (
            <form className="structured-form" onSubmit={handleCustomSubmit}>
              <div className="form-row">
                <label className="form-label">Disruption Category:</label>
                <select
                  className="form-select"
                  value={customKind}
                  onChange={(e) => setCustomKind(e.target.value as any)}
                  disabled={isActing}
                >
                  <option value="road_closure">🚧 Road Closure</option>
                  <option value="weather">🌧️ Weather Window</option>
                  <option value="budget_change">💰 Capital Budget Cap</option>
                  <option value="emergency">🚨 Emergency Corridor Access</option>
                </select>
              </div>

              {(customKind === "road_closure" || customKind === "emergency") && (
                <div className="form-row">
                  <label className="form-label">Affected Street Segment:</label>
                  <select
                    className="form-select"
                    value={selectedSegId}
                    onChange={(e) => setSelectedSegId(e.target.value)}
                    disabled={isActing}
                  >
                    {segments.map((seg) => (
                      <option key={seg.id} value={seg.id}>
                        {seg.name} ({seg.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {customKind === "road_closure" && (
                <div className="form-row">
                  <label className="form-label">Closure Duration (Days):</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={closureDays}
                    onChange={(e) => setClosureDays(Number(e.target.value))}
                    disabled={isActing}
                    className="form-input"
                  />
                </div>
              )}

              {customKind === "weather" && (
                <div className="form-row-grid">
                  <div className="form-row">
                    <label className="form-label">Start Day:</label>
                    <input
                      type="number"
                      min={0}
                      value={weatherFrom}
                      onChange={(e) => setWeatherFrom(Number(e.target.value))}
                      disabled={isActing}
                      className="form-input"
                    />
                  </div>
                  <div className="form-row">
                    <label className="form-label">End Day:</label>
                    <input
                      type="number"
                      min={weatherFrom + 1}
                      value={weatherTo}
                      onChange={(e) => setWeatherTo(Number(e.target.value))}
                      disabled={isActing}
                      className="form-input"
                    />
                  </div>
                </div>
              )}

              {customKind === "budget_change" && (
                <div className="form-row">
                  <label className="form-label">New Budget Cap (USD):</label>
                  <input
                    type="number"
                    min={50000}
                    step={10000}
                    value={budgetCap}
                    onChange={(e) => setBudgetCap(Number(e.target.value))}
                    disabled={isActing}
                    className="form-input"
                  />
                </div>
              )}

              {customKind === "emergency" && (
                <div className="form-row-grid">
                  <div className="form-row">
                    <label className="form-label">Duration (Days):</label>
                    <input
                      type="number"
                      min={1}
                      value={emergencyDays}
                      onChange={(e) => setEmergencyDays(Number(e.target.value))}
                      disabled={isActing}
                      className="form-input"
                    />
                  </div>
                  <div className="form-row">
                    <label className="form-label">Priority:</label>
                    <select
                      className="form-select"
                      value={emergencyPriority}
                      onChange={(e) => setEmergencyPriority(e.target.value)}
                      disabled={isActing}
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn-simulate-custom"
                disabled={isActing}
              >
                {isActing ? "Solving with CP-SAT…" : "Simulate Scenario"}
              </button>
            </form>
          )}

          {/* Tab 3: Natural Language Disruption Form */}
          {activeTab === "natural" && (
            <form className="nl-form-container" onSubmit={handleNaturalSubmit}>
              <label htmlFor="prompt-input" className="form-label">
                Describe Disruption in Plain English:
              </label>
              <textarea
                id="prompt-input"
                className="nl-textarea"
                placeholder="e.g. Flood on Main Street halts pipe trenching for 10 days"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                disabled={isActing}
              />
              <div className="nl-submit-row">
                <button
                  type="submit"
                  disabled={isActing || !promptText.trim()}
                  className="btn-parse-nemotron"
                >
                  <Sparkles size={14} />
                  <span>{isActing ? "Translating & Re-optimizing…" : "Parse & Replan"}</span>
                </button>
              </div>
            </form>
          )}

          {/* Active Baseline Status Card */}
          {plan && (
            <div className="active-baseline-card">
              <div className="baseline-header">
                <span className="baseline-title">Active Baseline Plan</span>
                <span className="baseline-status-pill">{plan.status.toUpperCase()}</span>
              </div>
              <div className="baseline-stats-row">
                <div className="baseline-stat-item">
                  <span className="baseline-stat-label">Makespan</span>
                  <span className="baseline-stat-val">{plan.total_days}d</span>
                </div>
                <div className="baseline-stat-item">
                  <span className="baseline-stat-label">Total Cost</span>
                  <span className="baseline-stat-val">
                    ${(plan.total_cost_usd / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="baseline-stat-item">
                  <span className="baseline-stat-label">Dig-Once Savings</span>
                  <span className="baseline-stat-val highlight">
                    ${(plan.dig_once_savings_usd / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

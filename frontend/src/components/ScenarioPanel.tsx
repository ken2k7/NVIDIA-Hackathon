import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Check,
  X,
  AlertTriangle,
  Send,
  Cpu,
  Radio,
  FileText,
} from "lucide-react";
import type { Plan, Project, ReplanResult } from "../types";
import type { ReplanInput } from "../api";
import "./ScenarioPanel.css";

// Compact USD formatter: $11.0M, $115k, $500.
function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  const a = Math.abs(n);
  if (a >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

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

// Internal stream of incoming field reports for telemetry simulation
const LIVE_DISPATCH_FEED = [
  "Water main rupture on Main Street requires 14-day emergency road closure and utility excavation.",
  "Heavy monsoon storm forecast for next 2 weeks; ground saturation stops deep trench excavation.",
  "City council cuts municipal infrastructure capital budget cap to $460,000 for this quarter.",
  "Hazardous gas leak detected near 2nd Avenue; critical corridor access required for 8 days.",
];

export const ScenarioPanel: React.FC<ScenarioPanelProps> = ({
  plan,
  replan,
  isActing,
  actionError,
  onTriggerReplan,
  onApprove,
  onReject,
  onClearError,
}) => {
  const [promptText, setPromptText] = useState(LIVE_DISPATCH_FEED[0]);
  const [analyzedPrompt, setAnalyzedPrompt] = useState<string>(LIVE_DISPATCH_FEED[0]);
  const [feedIndex, setFeedIndex] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isActing) return;
    setAnalyzedPrompt(promptText.trim());
    onTriggerReplan({ text: promptText.trim() });
  };

  const handleFetchSimulatedAlert = () => {
    const nextIdx = (feedIndex + 1) % LIVE_DISPATCH_FEED.length;
    setFeedIndex(nextIdx);
    setPromptText(LIVE_DISPATCH_FEED[nextIdx]);
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
    <div className="scenario-panel-root" role="region" aria-label="Nemotron Scenario Intelligence">
      {/* Action Error Banner */}
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

      {/* Active Proposal View (Diagnosed by Nemotron & Solved by CP-SAT) */}
      {replan ? (
        <div className="results-proposal-card">
          {/* Situation Ingested Banner */}
          <div className="ingested-situation-banner">
            <div className="ingested-situation-header">
              <FileText size={13} color="var(--accent-purple)" />
              <span className="ingested-label">Ingested Situation Report</span>
            </div>
            <p className="ingested-situation-text">"{analyzedPrompt || promptText}"</p>
          </div>

          {/* Nemotron Autonomous Diagnosis Header */}
          <div className="nemotron-diagnosis-box">
            <div className="diagnosis-top-row">
              <span className="nemotron-tag">
                <Sparkles size={13} />
                Nemotron Autonomous Diagnosis
              </span>
              <span className="solver-status-pill">
                <Cpu size={12} />
                OR-Tools CP-SAT Solved
              </span>
            </div>

            <div className="diagnosis-summary">
              <span className="diagnosis-kind">
                Diagnosed Scenario: <strong>{replan.disruption.kind.replace("_", " ").toUpperCase()}</strong>
              </span>
              <span className="diagnosis-param">
                {replan.disruption.kind === "road_closure" &&
                  `Corridor ${replan.disruption.segment_id} locked down for ${replan.disruption.days} days`}
                {replan.disruption.kind === "weather" &&
                  `Precipitation constraint applied (Days ${replan.disruption.from_day}–${replan.disruption.to_day})`}
                {replan.disruption.kind === "budget_change" &&
                  `Capital ceiling capped at $${replan.disruption.new_cap_usd.toLocaleString("en-US")}`}
                {replan.disruption.kind === "emergency" &&
                  `Priority ${replan.disruption.priority} clearance on Segment ${replan.disruption.segment_id}`}
              </span>
            </div>
          </div>

          {/* 4-Metric Before vs After Comparison Grid */}
          <div className="metrics-comparison-grid">
            {/* 1. Makespan / Duration */}
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
              <span className="metric-box-title">Total Cost</span>
              <div className="metric-box-values">
                <span className="metric-old-val">
                  {fmtUsd(replan.old_plan.total_cost_usd)}
                </span>
                <span className="metric-arrow">→</span>
                <span className="metric-new-val">
                  {fmtUsd(replan.new_plan.total_cost_usd)}
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
                  ? `+$${(diffCost / 1000).toFixed(0)}k cost`
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

          {/* NVIDIA Nemotron AI Reasoning Synthesis */}
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
              <span>{isActing ? "Committing Plan…" : "Approve & Commit Baseline"}</span>
            </button>
            <button
              id="btn-reject-replan"
              className="btn-reject-plan"
              disabled={isActing}
              onClick={onReject}
            >
              <X size={15} />
              <span>Discard Proposal</span>
            </button>
          </div>
        </div>
      ) : (
        /* Situation Dispatch Console (AI-First Interface) */
        <div className="situation-console-wrapper">
          <form className="situation-form" onSubmit={handleSubmit}>
            <div className="console-header">
              <div className="console-title-group">
                <Sparkles size={15} color="var(--accent-purple)" />
                <span className="console-title">Nemotron Situation Intake</span>
              </div>
              <span className="console-tag">
                <Radio size={10} className="pulse-dot" /> Live Telemetry
              </span>
            </div>

            <p className="console-subtitle">
              Enter any unforeseen field incident, municipal dispatch, or weather alert.
              Nemotron autonomously diagnoses the disruption, formulates mathematical constraints, and re-optimizes the coordinated schedule.
            </p>

            <div className="situation-input-toolbar">
              <label htmlFor="situation-input" className="input-field-label">
                Incident Dispatch / Situation Report
              </label>
              <button
                type="button"
                className="btn-fetch-feed"
                onClick={handleFetchSimulatedAlert}
                disabled={isActing}
                title="Fetch next incoming alert from simulated city telemetry stream"
              >
                <Radio size={12} className="pulse-dot" />
                <span>Simulate Field Incident</span>
              </button>
            </div>

            <textarea
              id="situation-input"
              className="situation-textarea"
              placeholder="e.g. Water main rupture on Main Street requires emergency excavation for 14 days..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              disabled={isActing}
              rows={3}
            />

            <button
              type="submit"
              disabled={isActing || !promptText.trim()}
              className="btn-analyze-situation"
            >
              {isActing ? (
                <>
                  <Zap size={14} className="spinning-icon" />
                  <span>Nemotron Diagnosing & Re-Solving…</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Diagnose with Nemotron & Re-Optimize</span>
                </>
              )}
            </button>
          </form>

          {/* Active Baseline Status Card */}
          {plan && (
            <div className="active-baseline-card">
              <div className="baseline-header">
                <span className="baseline-title">Current Operating Baseline</span>
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
                    {fmtUsd(plan.total_cost_usd)}
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

import React, { useState } from "react";
import type { Disruption, Plan, Project, ReplanResult } from "../types";
import type { ReplanInput } from "../api";

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
  const [promptText, setPromptText] = useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isActing) return;
    onTriggerReplan({ text: promptText.trim() });
  };

  const handlePresetTrigger = (disruption: Disruption) => {
    if (isActing) return;
    onTriggerReplan(disruption);
  };

  const firstSegmentId = project?.segments[0]?.id ?? "s1";

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
          <div className="scenario-shell-body">
            {/* Action error banner */}
            {actionError && (
              <div className="action-error-banner" role="alert">
                <span>{actionError}</span>
                <button className="btn-dismiss-error" onClick={onClearError}>
                  ✕
                </button>
              </div>
            )}

            {/* Replan Proposal Active View */}
            {replan ? (
              <div className="replan-proposal-card">
                <div className="proposal-header">
                  <span className="proposal-badge">Pending Planner Approval</span>
                  <span className="disruption-kind">
                    Disruption: {replan.disruption.kind}
                  </span>
                </div>

                {/* Plan Comparison Summary */}
                <div className="plan-diff-grid">
                  <div className="diff-card">
                    <span className="diff-label">Total Days</span>
                    <div className="diff-values">
                      <span className="old-val">{replan.old_plan.total_days}d</span>
                      <span className="diff-arrow">→</span>
                      <span className="new-val">{replan.new_plan.total_days}d</span>
                    </div>
                  </div>
                  <div className="diff-card">
                    <span className="diff-label">Dig-Once Savings</span>
                    <div className="diff-values">
                      <span className="old-val">
                        ${replan.old_plan.dig_once_savings_usd.toLocaleString()}
                      </span>
                      <span className="diff-arrow">→</span>
                      <span className="new-val highlight">
                        ${replan.new_plan.dig_once_savings_usd.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="diff-card">
                    <span className="diff-label">Closure Days</span>
                    <div className="diff-values">
                      <span className="old-val">{replan.old_plan.closure_days}d</span>
                      <span className="diff-arrow">→</span>
                      <span className="new-val">{replan.new_plan.closure_days}d</span>
                    </div>
                  </div>
                </div>

                {/* AI Explanation Box */}
                <div className="ai-explanation-box">
                  <div className="ai-badge">
                    <span>✨ NVIDIA Nemotron Synthesis</span>
                  </div>
                  <p className="explanation-text">{replan.explanation}</p>
                </div>

                {/* Human-in-the-loop Decision Controls */}
                <div className="proposal-actions">
                  <button
                    className="btn-approve"
                    disabled={isActing}
                    onClick={onApprove}
                  >
                    {isActing ? "Approving…" : "✓ Approve Plan"}
                  </button>
                  <button
                    className="btn-reject"
                    disabled={isActing}
                    onClick={onReject}
                  >
                    ✕ Discard Proposal
                  </button>
                </div>
              </div>
            ) : (
              /* Simulation & Scenario Input Form */
              <div className="scenario-controls">
                <p className="controls-hint">
                  Simulate unforeseen right-of-way disruptions to re-optimize schedule
                  and co-location bundling.
                </p>

                <div className="presets-group">
                  <span className="presets-label">Preset Disruption Scenarios:</span>
                  <div className="presets-buttons">
                    <button
                      className="preset-btn"
                      disabled={isActing}
                      onClick={() =>
                        handlePresetTrigger({
                          kind: "road_closure",
                          segment_id: firstSegmentId,
                          days: 14,
                        })
                      }
                    >
                      🚧 14d Road Closure ({firstSegmentId})
                    </button>
                    <button
                      className="preset-btn"
                      disabled={isActing}
                      onClick={() =>
                        handlePresetTrigger({
                          kind: "weather",
                          from_day: 10,
                          to_day: 18,
                        })
                      }
                    >
                      🌧️ Heavy Rain (Day 10–18)
                    </button>
                    <button
                      className="preset-btn"
                      disabled={isActing}
                      onClick={() =>
                        handlePresetTrigger({
                          kind: "budget_change",
                          new_cap_usd: 850000,
                        })
                      }
                    >
                      💰 $850k Budget Cap
                    </button>
                  </div>
                </div>

                <form className="natural-language-form" onSubmit={handleCustomSubmit}>
                  <label htmlFor="prompt-input" className="form-label">
                    Natural Language Disruption (Nemotron Parser):
                  </label>
                  <div className="input-group">
                    <input
                      id="prompt-input"
                      type="text"
                      placeholder="e.g. Flood on Main Street halts excavation for 10 days"
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      disabled={isActing}
                      className="text-input"
                    />
                    <button
                      type="submit"
                      disabled={isActing || !promptText.trim()}
                      className="btn-submit-scenario"
                    >
                      {isActing ? "Solving…" : "Simulate"}
                    </button>
                  </div>
                </form>

                {plan && (
                  <div className="baseline-status-card">
                    <span className="baseline-title">Active Baseline Plan</span>
                    <div className="baseline-metrics">
                      <span>Makespan: {plan.total_days} days</span>
                      <span>Total Cost: ${plan.total_cost_usd.toLocaleString()}</span>
                      <span>Status: {plan.status}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

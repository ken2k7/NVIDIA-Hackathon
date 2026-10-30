import React, { useMemo, useState } from "react";
import {
  Link as LinkIcon,
  Layers,
  SplitSquareVertical,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import type { Plan, Project, ReplanResult, ScheduledTask } from "../types";
import "./GanttChart.css";

export interface GanttChartProps {
  project: Project | null;
  plan: Plan | null;
  replan?: ReplanResult | null;
  selectedTaskId?: string | null;
  onSelectTask?: (taskId: string | null) => void;
}

type ViewMode = "active" | "old" | "diff";

export const GanttChart: React.FC<GanttChartProps> = ({
  project,
  plan,
  replan = null,
  selectedTaskId = null,
  onSelectTask,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(replan ? "diff" : "active");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(selectedTaskId);

  // Sync external selection if provided
  const currentSelectedId =
    selectedTaskId !== undefined && selectedTaskId !== null
      ? selectedTaskId
      : activeTaskId;

  const packages = useMemo(() => project?.packages ?? [], [project]);

  // Determine active plan to render based on viewMode
  const displayedPlan = useMemo<Plan | null>(() => {
    if (viewMode === "old" && replan?.old_plan) {
      return replan.old_plan;
    }
    if (viewMode === "active" && replan?.new_plan) {
      return replan.new_plan;
    }
    return plan ?? replan?.new_plan ?? null;
  }, [viewMode, replan, plan]);

  // Total horizon days
  const totalDays = useMemo(() => {
    const pDays = displayedPlan?.total_days ?? 30;
    const oldDays = replan?.old_plan.total_days ?? 0;
    const newDays = replan?.new_plan.total_days ?? 0;
    return Math.max(20, pDays, oldDays, newDays);
  }, [displayedPlan, replan]);

  // Map of old plan tasks for quick diff lookups
  const oldTasksMap = useMemo(() => {
    const map = new Map<string, ScheduledTask>();
    if (replan?.old_plan?.tasks) {
      replan.old_plan.tasks.forEach((t) => {
        const id = t.work_package_id || t.project_id || "";
        if (id) map.set(id, t);
      });
    }
    return map;
  }, [replan]);

  // Map of current/displayed tasks
  const tasksMap = useMemo(() => {
    const map = new Map<string, ScheduledTask>();
    if (displayedPlan?.tasks) {
      displayedPlan.tasks.forEach((t) => {
        const id = t.work_package_id || t.project_id || "";
        if (id) map.set(id, t);
      });
    } else {
      // Fallback synthesis if no plan generated yet: create staggered mock schedule
      let dayOffset = 0;
      packages.forEach((pkg, idx) => {
        const start = dayOffset;
        const end = start + pkg.duration_days;
        map.set(pkg.id, {
          work_package_id: pkg.id,
          start_day: start,
          end_day: end,
          shared_trench_with: idx === 0 && packages.length > 1 ? packages[1].id : null,
        });
        dayOffset += Math.max(2, Math.floor(pkg.duration_days / 2));
      });
    }
    return map;
  }, [displayedPlan, packages]);

  // Generate day tick marks across the timeline horizon
  const dayTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = totalDays > 60 ? 10 : totalDays > 30 ? 5 : 2;
    for (let d = 0; d <= totalDays; d += step) {
      ticks.push(d);
    }
    if (ticks[ticks.length - 1] !== totalDays) {
      ticks.push(totalDays);
    }
    return ticks;
  }, [totalDays]);

  const handleTaskClick = (pkgId: string) => {
    const nextId = currentSelectedId === pkgId ? null : pkgId;
    setActiveTaskId(nextId);
    onSelectTask?.(nextId);
  };

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === currentSelectedId),
    [packages, currentSelectedId]
  );
  const selectedTask = useMemo(
    () => (currentSelectedId ? tasksMap.get(currentSelectedId) : null),
    [tasksMap, currentSelectedId]
  );

  return (
    <div className="gantt-root" role="region" aria-label="Schedule Gantt Timeline">
      {/* Gantt Toolbar: Metrics & View Mode Switcher */}
      <div className="gantt-toolbar">
        <div className="gantt-stats-group">
          <div className="gantt-badge highlight">
            <Clock size={14} />
            <span>Horizon: {totalDays} Days</span>
          </div>

          {displayedPlan && (
            <div className="gantt-badge synergy">
              <Zap size={14} />
              <span>
                Dig-Once Savings: ${displayedPlan.dig_once_savings_usd.toLocaleString("en-US")}
              </span>
            </div>
          )}

          <div className="gantt-badge">
            <Layers size={14} />
            <span>{packages.length} Work Packages</span>
          </div>
        </div>

        {/* Before / After View Mode Selector (when a Replan Proposal exists) */}
        {replan && (
          <div className="gantt-controls-group">
            <span className="form-label" style={{ margin: 0, textTransform: "none" }}>
              Scenario View:
            </span>
            <div className="view-mode-selector">
              <button
                className={`view-mode-btn ${viewMode === "active" ? "active" : ""}`}
                onClick={() => setViewMode("active")}
                title="View newly optimized proposal"
              >
                <Sparkles size={13} style={{ display: "inline", marginRight: 4 }} />
                Proposed (New)
              </button>
              <button
                className={`view-mode-btn ${viewMode === "old" ? "active" : ""}`}
                onClick={() => setViewMode("old")}
                title="View original baseline plan"
              >
                Baseline (Old)
              </button>
              <button
                className={`view-mode-btn diff-mode ${viewMode === "diff" ? "active" : ""}`}
                onClick={() => setViewMode("diff")}
                title="Compare schedule slip and adjustments"
              >
                <SplitSquareVertical size={13} style={{ display: "inline", marginRight: 4 }} />
                Diff Overlay
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Gantt Grid & Canvas */}
      <div className="gantt-canvas">
        <div className="gantt-inner-container">
          {/* Header Time Scale (Day Numbers) */}
          <div className="gantt-time-scale">
            <div className="gantt-column-title">Work Package</div>
            <div className="gantt-ticks-track">
              {dayTicks.map((day) => {
                const leftPct = (day / totalDays) * 100;
                return (
                  <div key={day} className="gantt-tick" style={{ left: `${leftPct}%` }}>
                    <span className="gantt-tick-label">D{day}</span>
                    <div className="gantt-tick-line"></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Work Package Rows with Scheduled Bars */}
          <div className="gantt-rows">
            {packages.map((pkg) => {
              const task = tasksMap.get(pkg.id);
              const oldTask = oldTasksMap.get(pkg.id);

              const isSelected = currentSelectedId === pkg.id;
              const hasSharedTrench = Boolean(task?.shared_trench_with);

              // Compute positioning percentages
              const startDay = task?.start_day ?? 0;
              const endDay = task?.end_day ?? pkg.duration_days;
              const duration = Math.max(1, endDay - startDay);

              const leftPct = (startDay / totalDays) * 100;
              const widthPct = Math.max(2, (duration / totalDays) * 100);

              // Diff overlay calculations
              const isDiffMode = viewMode === "diff" && Boolean(oldTask);
              const oldStart = oldTask?.start_day ?? 0;
              const oldEnd = oldTask?.end_day ?? pkg.duration_days;
              const oldDuration = Math.max(1, oldEnd - oldStart);
              const oldLeftPct = (oldStart / totalDays) * 100;
              const oldWidthPct = Math.max(2, (oldDuration / totalDays) * 100);

              const shiftDays = oldTask ? startDay - oldTask.start_day : 0;

              return (
                <div
                  key={pkg.id}
                  className={`gantt-row ${isSelected ? "selected" : ""}`}
                  onClick={() => handleTaskClick(pkg.id)}
                >
                  {/* Left Column: Package Identity & Metadata */}
                  <div className="gantt-package-cell">
                    <div className="gantt-package-title-row">
                      <span className={`utility-badge utility-${pkg.utility}`}>
                        {pkg.utility}
                      </span>
                      <span className="gantt-package-name" title={pkg.name}>
                        {pkg.name}
                      </span>
                    </div>
                    <div className="gantt-package-meta">
                      <span className="gantt-segment-badge">{pkg.segment_id}</span>
                      <span>{duration}d duration</span>
                      {isDiffMode && shiftDays !== 0 && (
                        <span
                          className={`shift-indicator-badge ${
                            shiftDays > 0 ? "shift-delayed" : "shift-advanced"
                          }`}
                        >
                          {shiftDays > 0 ? `+${shiftDays}d slip` : `${shiftDays}d advance`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Timeline Bar Track */}
                  <div className="gantt-bar-track">
                    {/* Vertical Background Gridlines */}
                    {dayTicks.map((day) => (
                      <div
                        key={day}
                        className={`gantt-gridline ${day % 10 === 0 ? "major" : ""}`}
                        style={{ left: `${(day / totalDays) * 100}%` }}
                      ></div>
                    ))}

                    {/* Diff Overlay Ghost Bar (Original Baseline Position) */}
                    {isDiffMode && shiftDays !== 0 && (
                      <div
                        className="gantt-ghost-bar"
                        style={{
                          left: `${oldLeftPct}%`,
                          width: `${oldWidthPct}%`,
                        }}
                        title={`Baseline position: Day ${oldStart}–${oldEnd}`}
                      >
                        <span className="ghost-label">Baseline (D{oldStart}–D{oldEnd})</span>
                      </div>
                    )}

                    {/* Active Scheduled Task Bar */}
                    <div
                      className={`gantt-task-bar utility-${pkg.utility} ${
                        hasSharedTrench ? "is-cotrenched" : ""
                      } ${isSelected ? "selected" : ""}`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                      }}
                      title={`${pkg.name} (Day ${startDay}–${endDay})`}
                    >
                      <span className="bar-day-label">
                        D{startDay}–D{endDay}
                      </span>

                      {/* 🔗 Shared-Trench Co-Location Indicator Marker */}
                      {hasSharedTrench && (
                        <span
                          className="cotrench-link-pill"
                          title={`Co-trenched with work package ${task?.shared_trench_with}`}
                        >
                          <LinkIcon size={11} />
                          <span>Co-Trench</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gantt Legend */}
      <div className="gantt-legend">
        <span style={{ fontWeight: 600 }}>Legend:</span>
        <div className="gantt-legend-item">
          <span className="gantt-legend-dot" style={{ background: "#3b82f6" }}></span>
          <span>Water</span>
        </div>
        <div className="gantt-legend-item">
          <span className="gantt-legend-dot" style={{ background: "#8b5cf6" }}></span>
          <span>Fiber</span>
        </div>
        <div className="gantt-legend-item">
          <span className="gantt-legend-dot" style={{ background: "#06b6d4" }}></span>
          <span>Drainage</span>
        </div>
        <div className="gantt-legend-item">
          <span className="gantt-legend-dot" style={{ background: "#f59e0b" }}></span>
          <span>Road Paving</span>
        </div>
        <div className="gantt-legend-item">
          <span
            className="gantt-legend-dot"
            style={{
              background: "#c084fc",
              boxShadow: "0 0 6px rgba(192, 132, 252, 0.8)",
            }}
          ></span>
          <span>🔗 Shared Trench (Dig-Once)</span>
        </div>
        {replan && (
          <div className="gantt-legend-item">
            <span
              style={{
                width: 14,
                height: 8,
                border: "1px dashed rgba(255,255,255,0.4)",
                display: "inline-block",
                borderRadius: 2,
              }}
            ></span>
            <span>Ghost Bar (Baseline)</span>
          </div>
        )}
      </div>

      {/* Selected Task Inspection Drawer */}
      {selectedPackage && (
        <div className="gantt-task-inspector">
          <div className="inspector-header">
            <div className="inspector-title-group">
              <span className={`utility-badge utility-${selectedPackage.utility}`}>
                {selectedPackage.utility}
              </span>
              <span className="inspector-title">{selectedPackage.name}</span>
            </div>
            <button
              className="btn-close-detail"
              onClick={() => setActiveTaskId(null)}
              title="Close inspection"
            >
              ✕
            </button>
          </div>

          <div className="inspector-metrics-grid">
            <div className="inspector-metric-card">
              <span className="inspector-metric-label">Scheduled Window</span>
              <span className="inspector-metric-val">
                Day {selectedTask?.start_day ?? 0} – Day {selectedTask?.end_day ?? selectedPackage.duration_days}
              </span>
            </div>

            <div className="inspector-metric-card">
              <span className="inspector-metric-label">Duration</span>
              <span className="inspector-metric-val">
                {selectedPackage.duration_days} Days
              </span>
            </div>

            <div className="inspector-metric-card">
              <span className="inspector-metric-label">Corridor Segment</span>
              <span className="inspector-metric-val">
                {selectedPackage.segment_id}
              </span>
            </div>

            {selectedPackage.cost_usd && (
              <div className="inspector-metric-card">
                <span className="inspector-metric-label">Direct Cost</span>
                <span className="inspector-metric-val">
                  ${selectedPackage.cost_usd.toLocaleString("en-US")}
                </span>
              </div>
            )}

            <div className="inspector-metric-card">
              <span className="inspector-metric-label">Trench Co-Location</span>
              <span
                className={`inspector-metric-val ${
                  selectedTask?.shared_trench_with ? "highlight" : ""
                }`}
              >
                {selectedTask?.shared_trench_with
                  ? `🔗 Synced with ${selectedTask.shared_trench_with}`
                  : "Independent Open Cut"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

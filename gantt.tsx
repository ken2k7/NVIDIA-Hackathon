import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Package,
  Check,
  X,
  Sparkles,
  SlidersHorizontal,
  Info,
  Layers,
  Cpu,
  GitMerge,
  AlertTriangle,
  Zap,
  RotateCcw,
  Award,
  ArrowRight,
  CheckCircle2,
  SplitSquareVertical,
  Flame
} from 'lucide-react';

// --- PURE UTC DATE UTILITIES ---
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseISO(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toISO(dateObj) {
  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function diffDays(startStr, endStr) {
  const d1 = parseISO(startStr);
  const d2 = parseISO(endStr);
  return Math.round((d2.getTime() - d1.getTime()) / MS_PER_DAY);
}

function addDays(dateStr, days) {
  const d = parseISO(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = parseISO(dateStr);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  const d = parseISO(dateStr);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// --- COLOR PALETTES FOR PACKAGES ---
const BAR_THEMES = [
  { name: 'Indigo', bg: 'bg-indigo-600', hover: 'hover:bg-indigo-500', ring: 'ring-indigo-400', badge: 'bg-indigo-500', text: 'text-indigo-300', softBg: 'bg-indigo-500/15', border: 'border-indigo-500/30' },
  { name: 'Emerald', bg: 'bg-emerald-600', hover: 'hover:bg-emerald-500', ring: 'ring-emerald-400', badge: 'bg-emerald-500', text: 'text-emerald-300', softBg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  { name: 'Amber', bg: 'bg-amber-600', hover: 'hover:bg-amber-500', ring: 'ring-amber-400', badge: 'bg-amber-500', text: 'text-amber-300', softBg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  { name: 'Rose', bg: 'bg-rose-600', hover: 'hover:bg-rose-500', ring: 'ring-rose-400', badge: 'bg-rose-500', text: 'text-rose-300', softBg: 'bg-rose-500/15', border: 'border-rose-500/30' },
  { name: 'Cyan', bg: 'bg-cyan-600', hover: 'hover:bg-cyan-500', ring: 'ring-cyan-400', badge: 'bg-cyan-500', text: 'text-cyan-300', softBg: 'bg-cyan-500/15', border: 'border-cyan-500/30' },
  { name: 'Violet', bg: 'bg-violet-600', hover: 'hover:bg-violet-500', ring: 'ring-violet-400', badge: 'bg-violet-500', text: 'text-violet-300', softBg: 'bg-violet-500/15', border: 'border-violet-500/30' },
];

// --- PRESET JOB SCHEDULING SCENARIO STARTING 28 OCT ---
const INITIAL_TIMELINE_START = '2026-10-28';
const INITIAL_TIMELINE_END = '2026-11-27'; // 30 Days Total

const INITIAL_PACKAGES = [
  {
    id: 'pkg-1',
    name: '@core/kernel-init',
    startDate: '2026-10-28',
    endDate: '2026-11-05',
    demand: 3,
    weight: 95,
    dependsOn: '',
    themeIdx: 0,
  },
  {
    id: 'pkg-2',
    name: '@auth/zero-trust',
    startDate: '2026-11-01',
    endDate: '2026-11-10',
    demand: 3,
    weight: 85,
    dependsOn: 'pkg-1', // Intentionally overlaps pkg-1 initially to demonstrate DAG & Pairwise Overlap!
    themeIdx: 1,
  },
  {
    id: 'pkg-3',
    name: '@data/stream-engine',
    startDate: '2026-11-04',
    endDate: '2026-11-14',
    demand: 4,
    weight: 90,
    dependsOn: '',
    themeIdx: 2,
  },
  {
    id: 'pkg-4',
    name: '@ui/unified-gantt',
    startDate: '2026-11-09',
    endDate: '2026-11-19',
    demand: 2,
    weight: 70,
    dependsOn: 'pkg-2',
    themeIdx: 4,
  },
  {
    id: 'pkg-5',
    name: '@cloud/edge-deploy',
    startDate: '2026-11-16',
    endDate: '2026-11-25',
    demand: 3,
    weight: 80,
    dependsOn: 'pkg-4',
    themeIdx: 3,
  },
];

export default function App() {
  // Timeline Window State (Starts 28 Oct)
  const [timelineStart, setTimelineStart] = useState(INITIAL_TIMELINE_START);
  const [timelineEnd, setTimelineEnd] = useState(INITIAL_TIMELINE_END);

  // Packages State
  const [packages, setPackages] = useState(INITIAL_PACKAGES);

  // Resource Capacity Limit (e.g., 6 CPU/Dev units)
  const [maxCapacity, setMaxCapacity] = useState(6);

  // Toggle Concurrency Lane Packing View inside the Unified Block
  const [showLanePacking, setShowLanePacking] = useState(true);
  const [showLaserGuides, setShowLaserGuides] = useState(true);

  // Formula Inspector Target: can be a package OR an elementary overlap subsection
  // { type: 'package' | 'subsection', id: string, data?: any }
  const [inspectedItem, setInspectedItem] = useState({ type: 'package', id: 'pkg-2' });

  // Selected Overlap Subsection for detailed bottom/inline inspection
  const [selectedSliceId, setSelectedSliceId] = useState(null);

  // Interactive Split-Bar Calendar Popup State
  // { pkgId, activeField: 'start' | 'end', rect }
  const [activePopup, setActivePopup] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState({ year: 2026, month: 9 }); // 9 = Oct, 10 = Nov

  // Add Package Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgStart, setNewPkgStart] = useState('2026-11-02');
  const [newPkgEnd, setNewPkgEnd] = useState('2026-11-11');
  const [newPkgDemand, setNewPkgDemand] = useState(2);
  const [newPkgWeight, setNewPkgWeight] = useState(75);
  const [newPkgDependsOn, setNewPkgDependsOn] = useState('');

  const popupRef = useRef(null);

  // Total Days in Timeline
  const totalDays = useMemo(() => {
    return Math.max(1, diffDays(timelineStart, timelineEnd));
  }, [timelineStart, timelineEnd]);

  // Close Calendar Popup on click outside
  useEffect(() => {
    function handleOutsideClick(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        if (e.target.closest('[data-gantt-bar-trigger="true"]')) return;
        setActivePopup(null);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // --- 1. LINE SWEEP / ELEMENTARY INTERVAL PARTITIONING (OVERLAP SUBSECTIONS) ---
  const overlapSubsections = useMemo(() => {
    // Collect critical day offsets clamped to [0, totalDays]
    const pointSet = new Set([0, totalDays]);
    packages.forEach((pkg) => {
      const s = Math.max(0, Math.min(totalDays, diffDays(timelineStart, pkg.startDate)));
      const e = Math.max(0, Math.min(totalDays, diffDays(timelineStart, pkg.endDate)));
      pointSet.add(s);
      pointSet.add(e);
    });

    const sortedPoints = Array.from(pointSet).sort((a, b) => a - b);
    const slices = [];

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const startDay = sortedPoints[i];
      const endDay = sortedPoints[i + 1];
      if (endDay <= startDay) continue;

      const sliceStartDate = addDays(timelineStart, startDay);
      const sliceEndDate = addDays(timelineStart, endDay);

      // Find all packages active during [startDay, endDay)
      const activePackages = packages.filter((pkg) => {
        const pStart = diffDays(timelineStart, pkg.startDate);
        const pEnd = diffDays(timelineStart, pkg.endDate);
        return pStart < endDay && pEnd > startDay;
      });

      const totalDemand = activePackages.reduce((sum, p) => sum + (Number(p.demand) || 1), 0);
      const totalWeight = activePackages.reduce((sum, p) => sum + (Number(p.weight) || 0), 0);

      // EXACT FORMULA APPLICATION:
      // left = start_day / total_days * 100%
      // width = (end - start) / total_days * 100%
      const leftPct = (startDay / totalDays) * 100;
      const widthPct = ((endDay - startDay) / totalDays) * 100;

      // Determine Contention Classification
      let state = 'idle'; // 0 jobs
      if (activePackages.length === 1 && totalDemand <= maxCapacity) {
        state = 'single'; // 1 job
      } else if (totalDemand > maxCapacity || activePackages.length >= 3) {
        state = 'critical'; // Multi-contention or Over-capacity
      } else if (activePackages.length === 2) {
        state = 'pairwise'; // Exact 2-project overlap
      }

      slices.push({
        id: `slice-${startDay}-${endDay}`,
        startDay,
        endDay,
        duration: endDay - startDay,
        startDate: sliceStartDate,
        endDate: sliceEndDate,
        leftPct,
        widthPct,
        activePackages,
        totalDemand,
        totalWeight,
        isOverCapacity: totalDemand > maxCapacity,
        state,
      });
    }

    return slices;
  }, [packages, timelineStart, totalDays, maxCapacity]);

  // --- 2. INTERVAL GRAPH COLORING (CONCURRENCY LANE PACKING) ---
  const lanePacking = useMemo(() => {
    // Sort jobs by start day, then by highest weight
    const sorted = [...packages].sort((a, b) => {
      const diff = diffDays(a.startDate, b.startDate);
      if (diff !== 0) return diff;
      return (b.weight || 0) - (a.weight || 0);
    });

    const lanes = []; // Array of arrays of packages
    const laneEndDays = []; // Tracks when each lane becomes free

    sorted.forEach((pkg) => {
      const sDay = diffDays(timelineStart, pkg.startDate);
      const eDay = diffDays(timelineStart, pkg.endDate);

      // Find first lane where last job ended <= sDay
      let assignedLane = -1;
      for (let i = 0; i < laneEndDays.length; i++) {
        if (laneEndDays[i] <= sDay) {
          assignedLane = i;
          break;
        }
      }

      if (assignedLane === -1) {
        assignedLane = lanes.length;
        lanes.push([]);
        laneEndDays.push(eDay);
      } else {
        laneEndDays[assignedLane] = eDay;
      }

      lanes[assignedLane].push({
        ...pkg,
        laneIndex: assignedLane,
      });
    });

    return lanes;
  }, [packages, timelineStart]);

  // --- 3. DAG PRECEDENCE CONSTRAINT CHECKER ---
  const dagViolations = useMemo(() => {
    const map = {};
    packages.forEach((pkg) => {
      if (!pkg.dependsOn) return;
      const parent = packages.find((p) => p.id === pkg.dependsOn);
      if (!parent) return;
      // Violation if child starts before parent ends
      const overlapDays = diffDays(pkg.startDate, parent.endDate);
      if (overlapDays > 0) {
        map[pkg.id] = {
          parentId: parent.id,
          parentName: parent.name,
          parentEndDate: parent.endDate,
          overlapDays,
        };
      }
    });
    return map;
  }, [packages]);

  // Critical Boundary Points for Laser Lines
  const criticalBoundaryPoints = useMemo(() => {
    const pts = new Map();
    overlapSubsections.forEach((slice) => {
      if (slice.activePackages.length >= 2 || slice.isOverCapacity) {
        pts.set(slice.startDay, {
          day: slice.startDay,
          leftPct: (slice.startDay / totalDays) * 100,
          dateStr: slice.startDate,
          type: slice.isOverCapacity ? 'critical' : 'overlap',
        });
        pts.set(slice.endDay, {
          day: slice.endDay,
          leftPct: (slice.endDay / totalDays) * 100,
          dateStr: slice.endDate,
          type: slice.isOverCapacity ? 'critical' : 'overlap',
        });
      }
    });
    return Array.from(pts.values());
  }, [overlapSubsections, totalDays]);

  // Active Selected Slice Object
  const activeSlice = useMemo(() => {
    if (!selectedSliceId) {
      // Default to first overlap slice if available
      return overlapSubsections.find((s) => s.activePackages.length >= 2) || overlapSubsections[0] || null;
    }
    return overlapSubsections.find((s) => s.id === selectedSliceId) || overlapSubsections[0] || null;
  }, [selectedSliceId, overlapSubsections]);

  // --- 4. LIVE FORMULA INSPECTOR DATA ---
  const formulaData = useMemo(() => {
    if (inspectedItem?.type === 'subsection') {
      const slice = overlapSubsections.find((s) => s.id === inspectedItem.id) || activeSlice;
      if (slice) {
        return {
          badge: 'Overlap Subsection',
          title: `${formatShortDate(slice.startDate)} → ${formatShortDate(slice.endDate)} (${slice.activePackages.length} active)`,
          startDate: slice.startDate,
          endDate: slice.endDate,
          startDay: slice.startDay,
          endDay: slice.endDay,
          leftPct: slice.leftPct,
          widthPct: slice.widthPct,
        };
      }
    }

    const pkg = packages.find((p) => p.id === inspectedItem?.id) || packages[0];
    if (!pkg) return null;
    const startDay = diffDays(timelineStart, pkg.startDate);
    const endDay = diffDays(timelineStart, pkg.endDate);
    return {
      badge: 'Package Bar',
      title: pkg.name,
      startDate: pkg.startDate,
      endDate: pkg.endDate,
      startDay,
      endDay,
      leftPct: (startDay / totalDays) * 100,
      widthPct: ((endDay - startDay) / totalDays) * 100,
    };
  }, [inspectedItem, packages, overlapSubsections, activeSlice, timelineStart, totalDays]);

  // --- 5. SCHEDULING SOLVERS & ACTIONS ---

  // A. Enforce DAG Precedence Constraints (Topological Forward Shift)
  const handleEnforceDAG = () => {
    setPackages((prev) => {
      const next = prev.map((p) => ({ ...p }));
      let changed = true;
      let guard = 0;

      while (changed && guard < 25) {
        changed = false;
        guard++;
        next.forEach((pkg) => {
          if (!pkg.dependsOn) return;
          const parent = next.find((p) => p.id === pkg.dependsOn);
          if (!parent) return;
          if (diffDays(parent.endDate, pkg.startDate) < 0) {
            const duration = Math.max(1, diffDays(pkg.startDate, pkg.endDate));
            pkg.startDate = parent.endDate;
            pkg.endDate = addDays(pkg.startDate, duration);
            changed = true;
          }
        });
      }

      // Auto-expand timelineEnd if needed
      let maxEnd = timelineEnd;
      next.forEach((p) => {
        if (diffDays(maxEnd, p.endDate) > 0) maxEnd = p.endDate;
      });
      if (maxEnd !== timelineEnd) setTimelineEnd(maxEnd);

      return next;
    });
  };

  // B. Level Resource Capacity (Shifts lower-weight jobs out of over-capacity slices)
  const handleLevelResources = () => {
    setPackages((prev) => {
      // Order by precedence first, then highest weight, then earliest start
      const sorted = [...prev].map((p) => ({ ...p }));
      sorted.sort((a, b) => {
        if (b.dependsOn === a.id) return -1;
        if (a.dependsOn === b.id) return 1;
        return (b.weight || 0) - (a.weight || 0);
      });

      const placed = [];

      sorted.forEach((pkg) => {
        const duration = Math.max(1, diffDays(pkg.startDate, pkg.endDate));
        let candidateStart = pkg.startDate;

        // Respect parent dependency first
        if (pkg.dependsOn) {
          const parent = placed.find((p) => p.id === pkg.dependsOn) || sorted.find((p) => p.id === pkg.dependsOn);
          if (parent && diffDays(parent.endDate, candidateStart) < 0) {
            candidateStart = parent.endDate;
          }
        }

        // Step day-by-day until every day in [candidateStart, candidateStart + duration) respects maxCapacity
        let safe = false;
        let safetyCounter = 0;
        while (!safe && safetyCounter < 120) {
          safetyCounter++;
          safe = true;
          for (let d = 0; d < duration; d++) {
            const checkDate = addDays(candidateStart, d);
            const usedDemand = placed.reduce((sum, other) => {
              const active =
                diffDays(other.startDate, checkDate) >= 0 &&
                diffDays(checkDate, other.endDate) > 0;
              return sum + (active ? Number(other.demand) || 1 : 0);
            }, 0);

            if (usedDemand + (Number(pkg.demand) || 1) > maxCapacity) {
              candidateStart = addDays(checkDate, 1);
              safe = false;
              break;
            }
          }
        }

        pkg.startDate = candidateStart;
        pkg.endDate = addDays(candidateStart, duration);
        placed.push(pkg);
      });

      // Restore original row order
      const byId = Object.fromEntries(placed.map((p) => [p.id, p]));
      let maxEnd = timelineEnd;
      placed.forEach((p) => {
        if (diffDays(maxEnd, p.endDate) > 0) maxEnd = p.endDate;
      });
      if (maxEnd !== timelineEnd) setTimelineEnd(maxEnd);

      return prev.map((orig) => byId[orig.id] || orig);
    });
  };

  // C. Greedy Non-Overlapping Serialization (Zero Overlaps - 1 Job at a Time)
  const handleSerializeAll = () => {
    setPackages((prev) => {
      const sorted = [...prev]
        .map((p) => ({ ...p }))
        .sort((a, b) => {
          const d = diffDays(a.startDate, b.startDate);
          if (d !== 0) return d;
          return (b.weight || 0) - (a.weight || 0);
        });

      let cursorDate = sorted[0]?.startDate || timelineStart;
      sorted.forEach((pkg, idx) => {
        const duration = Math.max(1, diffDays(pkg.startDate, pkg.endDate));
        if (idx === 0) {
          cursorDate = pkg.endDate;
        } else {
          if (diffDays(cursorDate, pkg.startDate) < 0) {
            pkg.startDate = cursorDate;
            pkg.endDate = addDays(cursorDate, duration);
          }
          cursorDate = pkg.endDate;
        }
      });

      let maxEnd = timelineEnd;
      sorted.forEach((p) => {
        if (diffDays(maxEnd, p.endDate) > 0) maxEnd = p.endDate;
      });
      if (maxEnd !== timelineEnd) setTimelineEnd(maxEnd);

      const byId = Object.fromEntries(sorted.map((p) => [p.id, p]));
      return prev.map((orig) => byId[orig.id]);
    });
  };

  // D. Resolve Specific Selected Overlap Subsection (Shifts lowest-weight colliding job in slice)
  const handleResolveSliceOverlap = (slice) => {
    if (!slice || slice.activePackages.length < 2) return;
    // Sort active packages in this slice by weight ascending (lowest priority shifts after highest priority)
    const colliding = [...slice.activePackages].sort((a, b) => (a.weight || 0) - (b.weight || 0));
    const toShift = colliding[0];
    const anchorJob = colliding[colliding.length - 1];

    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== toShift.id) return pkg;
        const duration = Math.max(1, diffDays(pkg.startDate, pkg.endDate));
        const newStart = anchorJob.endDate;
        const newEnd = addDays(newStart, duration);
        if (diffDays(timelineEnd, newEnd) > 0) {
          setTimelineEnd(newEnd);
        }
        return { ...pkg, startDate: newStart, endDate: newEnd };
      })
    );
  };

  // Reset to initial preset
  const handleResetScenario = () => {
    setTimelineStart(INITIAL_TIMELINE_START);
    setTimelineEnd(INITIAL_TIMELINE_END);
    setPackages(INITIAL_PACKAGES);
    setMaxCapacity(6);
    setActivePopup(null);
  };

  // --- 6. INTERACTIVE SPLIT-BAR CALENDAR POPUP HANDLERS ---
  const handleBarSectionClick = (e, pkg, section) => {
    e.stopPropagation();
    const barEl = e.currentTarget.closest('[data-gantt-bar="true"]');
    const rect = barEl ? barEl.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();

    const targetIso = section === 'start' ? pkg.startDate : pkg.endDate;
    const parsed = parseISO(targetIso);

    setCalendarMonth({
      year: parsed.getUTCFullYear(),
      month: parsed.getUTCMonth(),
    });

    setInspectedItem({ type: 'package', id: pkg.id });
    setActivePopup({
      pkgId: pkg.id,
      activeField: section,
      rect: {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
      },
    });
  };

  const handleSelectDateFromPopup = (selectedIsoDate) => {
    if (!activePopup) return;
    const { pkgId, activeField } = activePopup;

    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg;
        let updatedStart = pkg.startDate;
        let updatedEnd = pkg.endDate;

        if (activeField === 'start') {
          updatedStart = selectedIsoDate;
          if (diffDays(updatedStart, updatedEnd) < 1) {
            updatedEnd = addDays(updatedStart, 1);
          }
          if (diffDays(timelineStart, updatedStart) < 0) {
            setTimelineStart(updatedStart);
          }
        } else {
          updatedEnd = selectedIsoDate;
          if (diffDays(updatedStart, updatedEnd) < 1) {
            updatedStart = addDays(updatedEnd, -1);
          }
          if (diffDays(timelineEnd, updatedEnd) > 0) {
            setTimelineEnd(updatedEnd);
          }
        }

        return { ...pkg, startDate: updatedStart, endDate: updatedEnd };
      })
    );
  };

  const handleNudgeDate = (pkg, field, deltaDays) => {
    const baseIso = field === 'start' ? pkg.startDate : pkg.endDate;
    handleSelectDateFromPopup(addDays(baseIso, deltaDays));
  };

  // Update package metadata inline (Demand, Weight, Dependency)
  const updatePackageMeta = (pkgId, field, value) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === pkgId ? { ...p, [field]: value } : p))
    );
  };

  // Add new package
  const handleAddPackage = (e) => {
    e.preventDefault();
    if (!newPkgName.trim()) return;
    let validEnd = newPkgEnd;
    if (diffDays(newPkgStart, validEnd) < 1) {
      validEnd = addDays(newPkgStart, 4);
    }

    const created = {
      id: `pkg-${Date.now()}`,
      name: newPkgName.trim(),
      startDate: newPkgStart,
      endDate: validEnd,
      demand: Math.max(1, Number(newPkgDemand) || 2),
      weight: Math.max(1, Number(newPkgWeight) || 50),
      dependsOn: newPkgDependsOn,
      themeIdx: packages.length % BAR_THEMES.length,
    };

    if (diffDays(timelineStart, created.startDate) < 0) setTimelineStart(created.startDate);
    if (diffDays(timelineEnd, created.endDate) > 0) setTimelineEnd(created.endDate);

    setPackages([...packages, created]);
    setInspectedItem({ type: 'package', id: created.id });
    setNewPkgName('');
    setShowAddModal(false);
  };

  const handleDeletePackage = (id) => {
    if (activePopup?.pkgId === id) setActivePopup(null);
    setPackages((prev) =>
      prev
        .filter((p) => p.id !== id)
        .map((p) => (p.dependsOn === id ? { ...p, dependsOn: '' } : p))
    );
  };

  // Header Timeline Date Ticks
  const timelineMarkers = useMemo(() => {
    const markers = [];
    const steps = Math.min(10, Math.max(5, Math.floor(totalDays / 3)));
    for (let i = 0; i <= steps; i++) {
      const dayOffset = Math.round((i / steps) * totalDays);
      const dateStr = addDays(timelineStart, dayOffset);
      markers.push({
        dayOffset,
        dateStr,
        label: formatShortDate(dateStr),
        leftPercent: (dayOffset / totalDays) * 100,
      });
    }
    return markers;
  }, [timelineStart, totalDays]);

  // Active package in popup
  const activePopupPackage = useMemo(() => {
    if (!activePopup) return null;
    return packages.find((p) => p.id === activePopup.pkgId) || null;
  }, [activePopup, packages]);

  // Calendar grid cells for popup
  const calendarGridDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(Date.UTC(year, month, 1));
    const startWeekday = firstDay.getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        iso: toISO(new Date(Date.UTC(year, month, d))),
      });
    }
    return cells;
  }, [calendarMonth]);

  // Summary Metrics
  const scheduleMetrics = useMemo(() => {
    const overlapSlices = overlapSubsections.filter((s) => s.activePackages.length >= 2);
    const totalOverlapDays = overlapSlices.reduce((acc, s) => acc + s.duration, 0);
    const overCapSlices = overlapSubsections.filter((s) => s.isOverCapacity);
    const peakDemand = overlapSubsections.reduce((max, s) => Math.max(max, s.totalDemand), 0);
    const violationCount = Object.keys(dagViolations).length;

    return {
      totalOverlapDays,
      overlapSliceCount: overlapSlices.length,
      overCapSliceCount: overCapSlices.length,
      peakDemand,
      violationCount,
      minLanesRequired: lanePacking.length,
    };
  }, [overlapSubsections, dagViolations, lanePacking]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* 1. TOP HEADER & SCHEDULING SOLVER TOOLBAR */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <SplitSquareVertical className="w-5 h-5" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Unified Block Gantt & Job Overlap Scheduler
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3 h-3" /> Line Sweep Partitioning
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Slicing concurrent jobs into elementary overlap subsections <code className="text-indigo-300 font-mono">[t_m, t_m+1]</code>. Click any bar’s <strong className="text-slate-200">Start (left)</strong> or <strong className="text-slate-200">End (right)</strong> date to pop up the calendar.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleResetScenario}
                title="Reset to 28 Oct preset scenario"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Job Package
              </button>
            </div>
          </div>

          {/* Second Row: Timeline Window, Capacity Slider & 1-Click Algorithmic Solvers */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            {/* Left controls: Window + Capacity */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Calendar Window */}
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-400">Window:</span>
                <input
                  type="date"
                  value={timelineStart}
                  onChange={(e) => {
                    if (e.target.value && diffDays(e.target.value, timelineEnd) > 2) {
                      setTimelineStart(e.target.value);
                    }
                  }}
                  className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
                />
                <span className="text-slate-600">→</span>
                <input
                  type="date"
                  value={timelineEnd}
                  onChange={(e) => {
                    if (e.target.value && diffDays(timelineStart, e.target.value) > 2) {
                      setTimelineEnd(e.target.value);
                    }
                  }}
                  className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
                />
                <span className="px-1.5 py-0.5 bg-slate-800 text-indigo-300 rounded font-mono text-[11px]">
                  {totalDays}d
                </span>
              </div>

              {/* Resource Capacity Limit Slider */}
              <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Max Capacity:</span>
                <input
                  type="range"
                  min={2}
                  max={12}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="w-20 accent-emerald-500 cursor-pointer"
                />
                <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                  scheduleMetrics.peakDemand > maxCapacity
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/15 text-emerald-300'
                }`}>
                  {maxCapacity} units (Peak: {scheduleMetrics.peakDemand})
                </span>
              </div>
            </div>

            {/* Right controls: 1-Click Job Scheduling Solvers */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleEnforceDAG}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  scheduleMetrics.violationCount > 0
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 animate-pulse'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <GitMerge className="w-3.5 h-3.5" />
                Enforce DAG ({scheduleMetrics.violationCount} violations)
              </button>

              <button
                onClick={handleLevelResources}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  scheduleMetrics.overCapSliceCount > 0
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Level Capacity ({scheduleMetrics.overCapSliceCount} bottlenecks)
              </button>

              <button
                onClick={handleSerializeAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                Auto-Resolve All Overlaps ({scheduleMetrics.totalOverlapDays}d)
              </button>
            </div>
          </div>
        </div>

        {/* 2. LIVE FORMULA INSPECTOR BAR */}
        {formulaData && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400">
                    {formulaData.badge} Formula
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {formulaData.title}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  <span className="text-slate-200">{formatShortDate(formulaData.startDate)}</span> (start_day = {formulaData.startDay}) →{' '}
                  <span className="text-slate-200">{formatShortDate(formulaData.endDate)}</span> (end_day = {formulaData.endDay}) •{' '}
                  total_days = <span className="text-slate-200 font-mono">{totalDays}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs w-full lg:w-auto justify-end">
              <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <span className="text-slate-400">left =</span>
                <span className="text-slate-300">
                  ({formulaData.startDay}/{totalDays})*100%
                </span>
                <span className="text-indigo-400 font-bold">
                  = {formulaData.leftPct.toFixed(2)}%
                </span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <span className="text-slate-400">width =</span>
                <span className="text-slate-300">
                  (({formulaData.endDay}-{formulaData.startDay})/{totalDays})*100%
                </span>
                <span className="text-emerald-400 font-bold">
                  = {formulaData.widthPct.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. UNIFIED SCHEDULING BLOCK (MASTER SUBSECTIONS + CONCURRENCY LANES + PACKAGE TRACKS) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* A. TIMELINE CALENDAR HEADER */}
          <div className="flex border-b border-slate-800 bg-slate-950/90 select-none">
            <div className="w-72 md:w-80 flex-shrink-0 px-4 py-3.5 border-r border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Unified Schedule Block
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowLanePacking(!showLanePacking)}
                  title="Toggle Concurrency Lane Packing View"
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                    showLanePacking
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  Lanes ({lanePacking.length})
                </button>
                <button
                  onClick={() => setShowLaserGuides(!showLaserGuides)}
                  title="Toggle Vertical Overlap Laser Guides"
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                    showLaserGuides
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  Lasers
                </button>
              </div>
            </div>

            {/* Right Column: Calendar Date Ticks (28 Oct, etc.) */}
            <div className="flex-grow relative min-h-[50px] overflow-hidden">
              {timelineMarkers.map((marker, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === timelineMarkers.length - 1;
                return (
                  <div
                    key={idx}
                    style={{ left: `${marker.leftPercent}%` }}
                    className="absolute top-0 bottom-0 flex flex-col justify-between py-2 pointer-events-none"
                  >
                    <span
                      className={`text-[11px] font-semibold text-slate-300 whitespace-nowrap ${
                        isFirst
                          ? 'translate-x-2'
                          : isLast
                          ? '-translate-x-full -ml-2'
                          : '-translate-x-1/2'
                      }`}
                    >
                      {marker.label}
                    </span>
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-[9px] font-mono text-slate-500 ${
                          isFirst
                            ? 'translate-x-2'
                            : isLast
                            ? '-translate-x-full -ml-2'
                            : ''
                        }`}
                      >
                        d{marker.dayOffset}
                      </span>
                      <div className="w-px h-2 bg-slate-700" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* B. MASTER UNIFIED OVERLAP SUBSECTIONS TRACK (LINE SWEEP PARTITIONING) */}
          <div className="flex border-b-2 border-slate-800 bg-slate-950/60">
            {/* Left Label */}
            <div className="w-72 md:w-80 flex-shrink-0 px-4 py-3 border-r border-slate-800 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                  Overlap Subsections
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {overlapSubsections.length} slices
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Click any slice <code className="text-slate-300">[t_m, t_m+1]</code> to inspect colliding jobs & demand.
              </p>
            </div>

            {/* Right Track: Continuous Non-Overlapping Elementary Subsections */}
            <div className="flex-grow relative min-h-[76px] bg-slate-950 p-y-1 flex items-stretch overflow-hidden">
              {overlapSubsections.map((slice) => {
                const isSelected = activeSlice?.id === slice.id;

                // Visual Styling by Contention State
                let sliceStyle = 'bg-slate-900/40 text-slate-600 border-r border-slate-800/70';
                let badgeText = 'Idle';
                if (slice.state === 'single') {
                  sliceStyle =
                    'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border-r border-emerald-500/30';
                  badgeText = '1 Job';
                } else if (slice.state === 'pairwise') {
                  sliceStyle =
                    'bg-amber-500/25 hover:bg-amber-500/35 text-amber-100 border-r border-amber-400/50';
                  badgeText = '2 Overlap';
                } else if (slice.state === 'critical') {
                  sliceStyle =
                    'bg-rose-500/30 hover:bg-rose-500/40 text-rose-100 border-r border-rose-400/60';
                  badgeText = slice.isOverCapacity ? 'Over Cap!' : `${slice.activePackages.length} Overlap`;
                }

                return (
                  <button
                    key={slice.id}
                    type="button"
                    onMouseEnter={() =>
                      setInspectedItem({ type: 'subsection', id: slice.id })
                    }
                    onClick={() => setSelectedSliceId(slice.id)}
                    style={{
                      left: `${slice.leftPct}%`,
                      width: `${slice.widthPct}%`,
                    }}
                    title={`${formatShortDate(slice.startDate)} → ${formatShortDate(slice.endDate)} (${slice.duration}d) | ${slice.activePackages.length} Jobs | Demand: ${slice.totalDemand}/${maxCapacity}`}
                    className={`absolute top-1.5 bottom-1.5 transition-all flex flex-col justify-between p-1.5 text-left overflow-hidden cursor-pointer select-none ${sliceStyle} ${
                      isSelected ? 'ring-2 ring-white z-20 brightness-125' : 'z-10'
                    }`}
                  >
                    {/* Top row inside slice: Date range & job count */}
                    <div className="flex items-center justify-between gap-1 w-full overflow-hidden">
                      <span className="text-[10px] font-bold tracking-tight truncate">
                        {badgeText}
                      </span>
                      {slice.totalDemand > 0 && (
                        <span
                          className={`text-[9px] font-mono px-1 rounded flex-shrink-0 ${
                            slice.isOverCapacity
                              ? 'bg-rose-600 text-white font-bold'
                              : 'bg-black/40 text-slate-200'
                          }`}
                        >
                          {slice.totalDemand}/{maxCapacity}u
                        </span>
                      )}
                    </div>

                    {/* Middle row: Active package color dots */}
                    <div className="flex items-center gap-1 my-0.5 overflow-hidden">
                      {slice.activePackages.map((p) => {
                        const t = BAR_THEMES[p.themeIdx % BAR_THEMES.length];
                        return (
                          <span
                            key={p.id}
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${t.badge} ring-1 ring-white/40`}
                            title={p.name}
                          />
                        );
                      })}
                    </div>

                    {/* Bottom row: Slice calendar bounds */}
                    <div className="text-[9px] font-mono opacity-80 truncate">
                      {formatShortDate(slice.startDate)}–{formatShortDate(slice.endDate)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* C. OPTIONAL CONCURRENCY LANE PACKING SUB-BLOCK (INTERVAL GRAPH COLORING) */}
          {showLanePacking && (
            <div className="flex border-b-2 border-slate-800 bg-slate-900/90">
              <div className="w-72 md:w-80 flex-shrink-0 px-4 py-3 border-r border-slate-800 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Packed Execution Lanes
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {lanePacking.length} Lanes
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Interval graph coloring packs non-overlapping jobs into minimum parallel tracks.
                </p>
              </div>

              <div className="flex-grow relative py-2 px-0 bg-slate-950/70 space-y-1.5 overflow-hidden">
                {/* Vertical Laser Guides */}
                {showLaserGuides &&
                  criticalBoundaryPoints.map((pt) => (
                    <div
                      key={`lane-laser-${pt.day}`}
                      style={{ left: `${pt.leftPct}%` }}
                      className={`absolute top-0 bottom-0 w-px pointer-events-none z-20 ${
                        pt.type === 'critical'
                          ? 'border-l border-dashed border-rose-500/70'
                          : 'border-l border-dashed border-amber-400/60'
                      }`}
                    />
                  ))}

                {lanePacking.map((laneJobs, laneIdx) => (
                  <div
                    key={`lane-${laneIdx}`}
                    className="relative h-7 bg-slate-900/60 border-y border-slate-800/50 flex items-center"
                  >
                    <span className="absolute left-2 z-20 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-400 border border-slate-800 pointer-events-none">
                      Lane {laneIdx + 1}
                    </span>

                    {laneJobs.map((pkg) => {
                      const sDay = diffDays(timelineStart, pkg.startDate);
                      const eDay = diffDays(timelineStart, pkg.endDate);
                      const leftPct = Math.max(0, Math.min(100, (sDay / totalDays) * 100));
                      const widthPct = Math.max(
                        1.5,
                        Math.min(100 - leftPct, ((eDay - sDay) / totalDays) * 100)
                      );
                      const theme = BAR_THEMES[pkg.themeIdx % BAR_THEMES.length];

                      return (
                        <div
                          key={`lane-job-${pkg.id}`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          onMouseEnter={() => setInspectedItem({ type: 'package', id: pkg.id })}
                          className={`absolute h-5 rounded-md ${theme.bg} px-2 flex items-center justify-between text-[10px] font-semibold text-white shadow-sm overflow-hidden whitespace-nowrap`}
                        >
                          <span className="truncate">{pkg.name}</span>
                          <span className="font-mono text-[9px] opacity-85 ml-1">
                            {formatShortDate(pkg.startDate)}–{formatShortDate(pkg.endDate)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* D. INDIVIDUAL PACKAGE ROWS WITH SPLIT-BAR INTERACTIVE CALENDAR TRIGGERS */}
          <div className="divide-y divide-slate-800/70 relative">
            {packages.map((pkg) => {
              const startDay = diffDays(timelineStart, pkg.startDate);
              const endDay = diffDays(timelineStart, pkg.endDate);
              const duration = endDay - startDay;

              // STRICT FORMULA:
              // left = start_day / total_days * 100%
              // width = (end - start) / total_days * 100%
              const rawLeft = (startDay / totalDays) * 100;
              const rawWidth = ((endDay - startDay) / totalDays) * 100;

              const clampedLeft = Math.max(0, Math.min(100, rawLeft));
              const clampedWidth = Math.max(2, Math.min(100 - clampedLeft, rawWidth));

              const theme = BAR_THEMES[pkg.themeIdx % BAR_THEMES.length];
              const isSelected = activePopup?.pkgId === pkg.id;
              const dagViolation = dagViolations[pkg.id];

              // Check if this package participates in the currently selected overlap slice
              const isInActiveSlice = activeSlice?.activePackages.some((p) => p.id === pkg.id);

              return (
                <div
                  key={pkg.id}
                  onMouseEnter={() => setInspectedItem({ type: 'package', id: pkg.id })}
                  className={`flex group transition-colors ${
                    isSelected
                      ? 'bg-slate-800/60'
                      : isInActiveSlice && activeSlice?.activePackages.length >= 2
                      ? 'bg-amber-500/[0.04]'
                      : 'hover:bg-slate-800/25'
                  }`}
                >
                  {/* Left Column: Package Name + Demand / Weight / DAG Dependency Controls */}
                  <div className="w-72 md:w-80 flex-shrink-0 px-4 py-3 border-r border-slate-800 flex flex-col justify-center gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${theme.badge}`} />
                        <span
                          className="font-semibold text-sm text-slate-100 truncate"
                          title={pkg.name}
                        >
                          {pkg.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {dagViolation && (
                          <span
                            title={`DAG Violation: Starts ${dagViolation.overlapDays}d before ${dagViolation.parentName} finishes (${formatShortDate(dagViolation.parentEndDate)})`}
                            className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-semibold flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3" /> DAG
                          </span>
                        )}
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          title="Remove package"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Job Metadata: Demand, Priority Weight, Predecessor */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                      {/* Demand */}
                      <label className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5">
                        <Cpu className="w-3 h-3 text-emerald-400" />
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={pkg.demand}
                          onChange={(e) =>
                            updatePackageMeta(pkg.id, 'demand', Math.max(1, Number(e.target.value)))
                          }
                          className="w-7 bg-transparent text-slate-200 font-mono text-[11px] focus:outline-none text-center"
                          title="Resource Demand Units"
                        />
                        <span className="text-[10px] text-slate-500">u</span>
                      </label>

                      {/* Priority Weight */}
                      <label className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5">
                        <Award className="w-3 h-3 text-amber-400" />
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={pkg.weight}
                          onChange={(e) =>
                            updatePackageMeta(pkg.id, 'weight', Math.max(1, Number(e.target.value)))
                          }
                          className="w-8 bg-transparent text-slate-200 font-mono text-[11px] focus:outline-none text-center"
                          title="Job Priority Weight"
                        />
                      </label>

                      {/* Predecessor Dependency Select */}
                      <select
                        value={pkg.dependsOn || ''}
                        onChange={(e) => updatePackageMeta(pkg.id, 'dependsOn', e.target.value)}
                        title="DAG Predecessor Dependency"
                        className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none max-w-[115px] truncate cursor-pointer"
                      >
                        <option value="">No Dep (Root)</option>
                        {packages
                          .filter((other) => other.id !== pkg.id)
                          .map((other) => (
                            <option key={other.id} value={other.id}>
                              After {other.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Right Column: Track with Positioned Split Gantt Bar & Overlap Striping */}
                  <div className="flex-grow relative min-h-[68px] flex items-center bg-slate-950/35 overflow-hidden">
                    {/* Background Grid Lines */}
                    {timelineMarkers.map((marker, mIdx) => (
                      <div
                        key={mIdx}
                        style={{ left: `${marker.leftPercent}%` }}
                        className="absolute top-0 bottom-0 w-px bg-slate-800/50 pointer-events-none"
                      />
                    ))}

                    {/* Vertical Laser Overlap Boundary Guides */}
                    {showLaserGuides &&
                      criticalBoundaryPoints.map((pt) => (
                        <div
                          key={`row-laser-${pt.day}`}
                          style={{ left: `${pt.leftPct}%` }}
                          className={`absolute top-0 bottom-0 w-px pointer-events-none z-15 ${
                            pt.type === 'critical'
                              ? 'border-l border-dashed border-rose-500/60'
                              : 'border-l border-dashed border-amber-400/50'
                          }`}
                        />
                      ))}

                    {/* Highlighted Active Overlap Slice Column Backdrop */}
                    {activeSlice && activeSlice.activePackages.length >= 2 && (
                      <div
                        style={{
                          left: `${activeSlice.leftPct}%`,
                          width: `${activeSlice.widthPct}%`,
                        }}
                        className="absolute top-0 bottom-0 bg-amber-500/[0.06] border-x border-amber-500/20 pointer-events-none"
                      />
                    )}

                    {/* THE POSITIONED GANTT BAR */}
                    <div
                      data-gantt-bar="true"
                      style={{
                        left: `${clampedLeft}%`,
                        width: `${clampedWidth}%`,
                      }}
                      className={`absolute h-11 rounded-xl ${theme.bg} shadow-lg transition-all duration-200 flex items-stretch select-none ${
                        isSelected
                          ? `ring-2 ${theme.ring} z-30 scale-[1.01]`
                          : dagViolation
                          ? 'ring-2 ring-amber-400 z-20'
                          : 'hover:brightness-110 z-20'
                      }`}
                    >
                      {/* LEFT HALF: CLICK TO ADJUST START DATE */}
                      <button
                        type="button"
                        data-gantt-bar-trigger="true"
                        onClick={(e) => handleBarSectionClick(e, pkg, 'start')}
                        title={`Click to adjust Start Date (${formatShortDate(pkg.startDate)})`}
                        className={`w-1/2 h-full flex items-center justify-start px-2.5 rounded-l-xl transition-colors cursor-pointer group/left border-r border-white/15 ${
                          isSelected && activePopup?.activeField === 'start'
                            ? 'bg-black/30'
                            : 'hover:bg-black/15'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CalendarIcon className="w-3 h-3 text-white/85 flex-shrink-0 group-hover/left:scale-110 transition-transform" />
                          <span className="text-[11px] font-bold text-white truncate">
                            {formatShortDate(pkg.startDate)}
                          </span>
                        </div>
                      </button>

                      {/* RIGHT HALF: CLICK TO ADJUST END DATE */}
                      <button
                        type="button"
                        data-gantt-bar-trigger="true"
                        onClick={(e) => handleBarSectionClick(e, pkg, 'end')}
                        title={`Click to adjust End Date (${formatShortDate(pkg.endDate)})`}
                        className={`w-1/2 h-full flex items-center justify-end px-2.5 rounded-r-xl transition-colors cursor-pointer group/right ${
                          isSelected && activePopup?.activeField === 'end'
                            ? 'bg-black/30'
                            : 'hover:bg-black/15'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[11px] font-bold text-white truncate">
                            {formatShortDate(pkg.endDate)}
                          </span>
                          <CalendarIcon className="w-3 h-3 text-white/85 flex-shrink-0 group-hover/right:scale-110 transition-transform" />
                        </div>
                      </button>

                      {/* Center Duration & Demand Pill Overlay */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/55 backdrop-blur-xs text-[10px] font-mono text-white">
                        <span>{duration}d</span>
                        <span className="text-white/50">•</span>
                        <span className="text-emerald-300">{pkg.demand}u</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* E. SELECTED OVERLAP SUBSECTION INSPECTOR & QUICK RESOLVER FOOTER */}
          {activeSlice && (
            <div className="bg-slate-950/95 border-t border-slate-800 p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <SplitSquareVertical className="w-4 h-4" />
                    Selected Subsection Inspector:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white">
                    {formatShortDate(activeSlice.startDate)} → {formatShortDate(activeSlice.endDate)} ({activeSlice.duration} days)
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    [left: {activeSlice.leftPct.toFixed(1)}%, width: {activeSlice.widthPct.toFixed(1)}%]
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      activeSlice.isOverCapacity
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : activeSlice.activePackages.length >= 2
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/15 text-emerald-300'
                    }`}
                  >
                    Demand: {activeSlice.totalDemand} / {maxCapacity} units ({activeSlice.activePackages.length} active jobs)
                  </span>
                </div>

                {/* Colliding Packages List in this Slice */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {activeSlice.activePackages.length === 0 ? (
                    <span className="text-xs text-slate-500">
                      No active packages during this interval (Idle slice).
                    </span>
                  ) : (
                    activeSlice.activePackages.map((pkg) => {
                      const t = BAR_THEMES[pkg.themeIdx % BAR_THEMES.length];
                      return (
                        <div
                          key={`slice-pkg-${pkg.id}`}
                          className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs ${t.softBg} ${t.border} ${t.text}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${t.badge}`} />
                          <span className="font-semibold text-white">{pkg.name}</span>
                          <span className="font-mono text-[11px] opacity-85">
                            ({formatShortDate(pkg.startDate)}–{formatShortDate(pkg.endDate)})
                          </span>
                          <span className="font-mono text-[10px] px-1 rounded bg-black/30">
                            {pkg.demand}u • w:{pkg.weight}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick Resolve Button for this specific Overlap Slice */}
              {activeSlice.activePackages.length >= 2 && (
                <button
                  onClick={() => handleResolveSliceOverlap(activeSlice)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex-shrink-0"
                >
                  <Zap className="w-4 h-4" />
                  Shift Lowest-Priority Job Out of This Overlap
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. FLOATING CALENDAR POPUP WHEN A BAR SECTION IS CLICKED */}
      {activePopup && activePopupPackage && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
          <div
            ref={popupRef}
            style={{
              position: 'fixed',
              top: Math.min(window.innerHeight - 440, Math.max(20, activePopup.rect.bottom + 10)),
              left: Math.min(
                window.innerWidth - 360,
                Math.max(
                  20,
                  activePopup.rect.left +
                    (activePopup.activeField === 'end' ? activePopup.rect.width / 2 : 0)
                )
              ),
            }}
            className="pointer-events-auto w-84 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/90 p-4 text-slate-100"
          >
            {/* Popup Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Interactive Calendar Picker
                </div>
                <div className="text-sm font-bold text-white truncate">
                  {activePopupPackage.name}
                </div>
              </div>
              <button
                onClick={() => setActivePopup(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Start / End Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 my-3 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const d = parseISO(activePopupPackage.startDate);
                  setCalendarMonth({ year: d.getUTCFullYear(), month: d.getUTCMonth() });
                  setActivePopup((prev) => ({ ...prev, activeField: 'start' }));
                }}
                className={`py-2 px-2.5 rounded-lg text-left transition-all cursor-pointer ${
                  activePopup.activeField === 'start'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
                  Start Date
                </div>
                <div className="text-xs font-bold mt-0.5 flex items-center justify-between">
                  <span>{formatShortDate(activePopupPackage.startDate)}</span>
                  <span className="font-mono text-[10px] opacity-75">
                    d{diffDays(timelineStart, activePopupPackage.startDate)}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const d = parseISO(activePopupPackage.endDate);
                  setCalendarMonth({ year: d.getUTCFullYear(), month: d.getUTCMonth() });
                  setActivePopup((prev) => ({ ...prev, activeField: 'end' }));
                }}
                className={`py-2 px-2.5 rounded-lg text-left transition-all cursor-pointer ${
                  activePopup.activeField === 'end'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
                  End Date
                </div>
                <div className="text-xs font-bold mt-0.5 flex items-center justify-between">
                  <span>{formatShortDate(activePopupPackage.endDate)}</span>
                  <span className="font-mono text-[10px] opacity-75">
                    d{diffDays(timelineStart, activePopupPackage.endDate)}
                  </span>
                </div>
              </button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-2 px-1">
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth((prev) =>
                    prev.month === 0
                      ? { year: prev.year - 1, month: 11 }
                      : { year: prev.year, month: prev.month - 1 }
                  )
                }
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-bold tracking-wide text-slate-200">
                {MONTHS_FULL[calendarMonth.month]} {calendarMonth.year}
              </div>
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth((prev) =>
                    prev.month === 11
                      ? { year: prev.year + 1, month: 0 }
                      : { year: prev.year, month: prev.month + 1 }
                  )
                }
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-500 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarGridDays.map((cell, idx) => {
                if (!cell) return <div key={`empty-${idx}`} className="h-8" />;

                const isStart = cell.iso === activePopupPackage.startDate;
                const isEnd = cell.iso === activePopupPackage.endDate;
                const inRange =
                  diffDays(activePopupPackage.startDate, cell.iso) > 0 &&
                  diffDays(cell.iso, activePopupPackage.endDate) > 0;
                const isEditingTarget =
                  (activePopup.activeField === 'start' && isStart) ||
                  (activePopup.activeField === 'end' && isEnd);

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => handleSelectDateFromPopup(cell.iso)}
                    className={`h-8 rounded-lg text-xs font-medium transition-all flex items-center justify-center cursor-pointer ${
                      isEditingTarget
                        ? 'bg-indigo-500 text-white font-bold ring-2 ring-indigo-300 shadow-md z-10'
                        : isStart || isEnd
                        ? 'bg-indigo-600/70 text-white font-semibold'
                        : inRange
                        ? 'bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/35'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Quick Nudge Controls */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleNudgeDate(activePopupPackage, activePopup.activeField, -1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                >
                  -1 Day
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeDate(activePopupPackage, activePopup.activeField, 1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                >
                  +1 Day
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActivePopup(null)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ADD NEW JOB PACKAGE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                Add Job Package to Schedule
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPackage} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Package Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., @ml/vector-indexer"
                  value={newPkgName}
                  onChange={(e) => setNewPkgName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newPkgStart}
                    onChange={(e) => setNewPkgStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newPkgEnd}
                    onChange={(e) => setNewPkgEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Resource Demand (Units)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={newPkgDemand}
                    onChange={(e) => setNewPkgDemand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Priority Weight (1-100)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newPkgWeight}
                    onChange={(e) => setNewPkgWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Predecessor Dependency (Optional DAG)
                </label>
                <select
                  value={newPkgDependsOn}
                  onChange={(e) => setNewPkgDependsOn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">None (Independent Job)</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      Must start after {p.name} ({formatShortDate(p.endDate)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  Add Job Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

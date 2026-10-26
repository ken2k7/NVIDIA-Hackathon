import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CoLocation, Disruption, ReplanResult, Segment, WorkPackage } from "../types";

export interface MapViewProps {
  segments: Segment[];
  packages?: WorkPackage[];
  colocations?: CoLocation[];
  replan?: ReplanResult | null;
  selectedSegmentId?: string | null;
  onSelectSegment?: (segmentId: string | null) => void;
}

// Default coordinate fallbacks in case a segment lacks explicit coordinates
const FALLBACK_SEGMENT_COORDS: Record<string, [number, number][]> = {
  s1: [
    [40.7484, -73.9857],
    [40.752, -73.981],
  ],
  s2: [
    [40.752, -73.981],
    [40.7558, -73.976],
  ],
  s3: [
    [40.7492, -73.987],
    [40.7528, -73.9829],
  ],
  s4: [
    [40.745, -73.991],
    [40.7475, -73.9865],
  ],
  ST_MAIN: [
    [40.7484, -73.9851],
    [40.752, -73.981],
  ],
  ST_BROADWAY: [
    [40.7492, -73.987],
    [40.7528, -73.9829],
  ],
  ST_OAK: [
    [40.745, -73.991],
    [40.7475, -73.9865],
  ],
  ST_ELM: [
    [40.741, -73.98],
    [40.744, -73.9755],
  ],
  ST_PINE: [
    [40.748, -73.995],
    [40.751, -73.99],
  ],
};

/**
 * Normalizes coordinates to Leaflet [lat, lng] format.
 * Automatically flips GeoJSON [lng, lat] if longitude was passed first.
 */
function normalizeCoords(coords?: [number, number][], id?: string): [number, number][] {
  if (coords && coords.length >= 2) {
    return coords.map(([first, second]) => {
      // If first number is < -50, it is longitude (e.g. -73.98 or -122.41), so flip to [lat, lng]
      if (first < -50 && second > 0) {
        return [second, first];
      }
      return [first, second];
    });
  }

  if (id && FALLBACK_SEGMENT_COORDS[id]) {
    return FALLBACK_SEGMENT_COORDS[id];
  }

  // Generic fallback if completely unspecified
  return [
    [40.7484, -73.9857],
    [40.752, -73.981],
  ];
}

/**
 * Helper to auto-fit bounds whenever segments change
 */
function AutoFitBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      try {
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
      } catch {
        // Safe boundary catch
      }
    }
  }, [bounds, map]);
  return null;
}

export type SegmentStatusKind = "closed" | "colocation" | "work" | "none";

interface SegmentEvaluation {
  status: SegmentStatusKind;
  color: string;
  label: string;
  packages: WorkPackage[];
  isDisrupted: boolean;
  disruptionReason?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  segments,
  packages = [],
  colocations = [],
  replan = null,
  selectedSegmentId = null,
  onSelectSegment,
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const activeSegmentId =
    selectedSegmentId !== undefined && selectedSegmentId !== null
      ? selectedSegmentId
      : internalSelectedId;

  // Extract affected segment id from replan disruption
  const disruptedSegmentId = useMemo(() => {
    if (!replan?.disruption) return null;
    const d = replan.disruption as Disruption;
    if ("segment_id" in d && typeof d.segment_id === "string") {
      return d.segment_id;
    }
    return null;
  }, [replan]);

  // Evaluate each segment based on Issue 7 color rules
  const evaluatedSegments = useMemo(() => {
    const map = new Map<string, SegmentEvaluation>();

    for (const seg of segments) {
      const segPackages = packages.filter((p) => p.segment_id === seg.id);

      // Rule 1: Closed on disruption -> RED
      const isDisrupted =
        seg.id === disruptedSegmentId ||
        (replan?.disruption.kind === "road_closure" &&
          (replan.disruption as { segment_id: string }).segment_id === seg.id) ||
        (replan?.disruption.kind === "emergency" &&
          (replan.disruption as { segment_id: string }).segment_id === seg.id);

      if (isDisrupted) {
        map.set(seg.id, {
          status: "closed",
          color: "#ef4444", // Bright Red
          label: "Closed (Disruption Active)",
          packages: segPackages,
          isDisrupted: true,
          disruptionReason:
            replan?.disruption.kind === "road_closure"
              ? `Road Closure (${(replan.disruption as { days: number }).days} days)`
              : `Disruption Event: ${replan?.disruption.kind}`,
        });
        continue;
      }

      // Rule 2: Co-location candidate -> PURPLE
      // Either multiple packages on the segment, or matches a compatible co-location pair
      const hasCoLocation =
        segPackages.length >= 2 ||
        colocations.some((c) =>
          segPackages.some(
            (p) =>
              (p.id === c.package_a || p.id === c.package_b) && c.compatible
          )
        );

      if (hasCoLocation) {
        map.set(seg.id, {
          status: "colocation",
          color: "#a855f7", // Purple
          label: "Co-Location Candidate (Synergy)",
          packages: segPackages,
          isDisrupted: false,
        });
        continue;
      }

      // Rule 3: Has work packages -> BLUE
      if (segPackages.length > 0) {
        map.set(seg.id, {
          status: "work",
          color: "#3b82f6", // Blue
          label: "Active Work Scheduled",
          packages: segPackages,
          isDisrupted: false,
        });
        continue;
      }

      // Rule 4: None -> GREY
      map.set(seg.id, {
        status: "none",
        color: "#64748b", // Slate Grey
        label: "No Work Scheduled",
        packages: [],
        isDisrupted: false,
      });
    }

    return map;
  }, [segments, packages, colocations, disruptedSegmentId, replan]);

  // Compute bounding box for AutoFitBounds
  const allBounds = useMemo<LatLngBoundsExpression | null>(() => {
    const allPoints: [number, number][] = [];
    segments.forEach((seg) => {
      const pts = normalizeCoords(seg.coords, seg.id);
      allPoints.push(...pts);
    });

    if (allPoints.length === 0) return null;

    let minLat = 90;
    let maxLat = -90;
    let minLng = 180;
    let maxLng = -180;

    allPoints.forEach(([lat, lng]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    return [
      [minLat, minLng],
      [maxLat, maxLng],
    ];
  }, [segments]);

  // Initial center position
  const initialCenter = useMemo<LatLngExpression>(() => {
    if (segments.length > 0) {
      const firstCoords = normalizeCoords(segments[0].coords, segments[0].id);
      if (firstCoords.length > 0) {
        return firstCoords[0];
      }
    }
    return [40.75, -73.98];
  }, [segments]);

  const handleSelect = (id: string) => {
    const nextId = activeSegmentId === id ? null : id;
    setInternalSelectedId(nextId);
    onSelectSegment?.(nextId);
  };

  const selectedEvaluation = activeSegmentId
    ? evaluatedSegments.get(activeSegmentId)
    : null;
  const selectedSegment = segments.find((s) => s.id === activeSegmentId);

  return (
    <div className="map-view-container">
      {/* Interactive Leaflet Map */}
      <div className="map-canvas-wrapper">
        <MapContainer
          center={initialCenter}
          zoom={14}
          scrollWheelZoom={true}
          className="leaflet-map-root"
        >
          {/* CartoDB Dark Matter tile layer for cohesive dark aesthetics */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          <AutoFitBounds bounds={allBounds} />

          {/* Render one Polyline per street segment */}
          {segments.map((segment) => {
            const coords = normalizeCoords(segment.coords, segment.id);
            const evalData = evaluatedSegments.get(segment.id) ?? {
              status: "none",
              color: "#64748b",
              label: "No Work",
              packages: [],
              isDisrupted: false,
            };

            const isSelected = activeSegmentId === segment.id;
            const isClosed = evalData.status === "closed";

            // Visual line weight & dash styling
            const weight = isSelected ? 9 : isClosed ? 8 : 6;
            const opacity = isSelected ? 1 : isClosed ? 0.95 : 0.85;
            const dashArray = isClosed ? "8, 6" : undefined;

            return (
              <Polyline
                key={segment.id}
                positions={coords}
                pathOptions={{
                  color: evalData.color,
                  weight,
                  opacity,
                  dashArray,
                  lineCap: "round",
                  lineJoin: "round",
                }}
                eventHandlers={{
                  click: () => handleSelect(segment.id),
                }}
              >
                {/* Informative Tooltip listing segment info & jobs */}
                <Tooltip sticky permanent={false} direction="top">
                  <div className="map-tooltip-content">
                    <div className="tooltip-header">
                      <span className="tooltip-title">{segment.name}</span>
                      <span className="tooltip-id">{segment.id}</span>
                    </div>

                    <div
                      className={`tooltip-status-pill status-${evalData.status}`}
                    >
                      <span className="tooltip-status-dot"></span>
                      <span>{evalData.label}</span>
                    </div>

                    {evalData.isDisrupted && evalData.disruptionReason && (
                      <div className="tooltip-disruption-alert">
                        ⚠️ {evalData.disruptionReason}
                      </div>
                    )}

                    <div className="tooltip-meta">
                      {segment.traffic_weight && (
                        <span>Traffic Disruption: {segment.traffic_weight}/10</span>
                      )}
                      {segment.moratorium_until_day ? (
                        <span className="tooltip-moratorium">
                          Moratorium: Day {segment.moratorium_until_day}
                        </span>
                      ) : null}
                    </div>

                    {/* Jobs listing */}
                    <div className="tooltip-jobs-section">
                      <div className="tooltip-jobs-count">
                        Work Packages ({evalData.packages.length}):
                      </div>
                      {evalData.packages.length === 0 ? (
                        <div className="tooltip-no-jobs">No jobs on this segment</div>
                      ) : (
                        <ul className="tooltip-jobs-list">
                          {evalData.packages.map((pkg) => (
                            <li key={pkg.id} className="tooltip-job-item">
                              <span
                                className={`job-utility-badge utility-${pkg.utility}`}
                              >
                                {pkg.utility}
                              </span>
                              <span className="job-name">{pkg.name}</span>
                              <span className="job-duration">
                                {pkg.duration_days}d
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}
        </MapContainer>

        {/* Map Legend Overlay */}
        <div className="map-legend-card" role="region" aria-label="Map Legend">
          <span className="legend-title">Right-of-Way Layers</span>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-swatch swatch-closed"></span>
              <span className="legend-label">Closed (Disruption)</span>
            </div>
            <div className="legend-item">
              <span className="legend-swatch swatch-colocation"></span>
              <span className="legend-label">Co-Location Synergy</span>
            </div>
            <div className="legend-item">
              <span className="legend-swatch swatch-work"></span>
              <span className="legend-label">Active Work</span>
            </div>
            <div className="legend-item">
              <span className="legend-swatch swatch-none"></span>
              <span className="legend-label">No Active Work</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Segment Inspection Drawer / Card */}
      {selectedSegment && selectedEvaluation && (
        <div className="segment-detail-bar">
          <div className="detail-header">
            <div>
              <span className="detail-name">{selectedSegment.name}</span>
              <span className="detail-id">({selectedSegment.id})</span>
            </div>
            <button
              className="btn-close-detail"
              onClick={() => {
                setInternalSelectedId(null);
                onSelectSegment?.(null);
              }}
              title="Close inspection"
            >
              ✕
            </button>
          </div>

          <div className="detail-body">
            <div
              className={`detail-status-badge status-${selectedEvaluation.status}`}
            >
              {selectedEvaluation.label}
            </div>

            {selectedEvaluation.isDisrupted && (
              <div className="detail-disruption-callout">
                🚨 Disruption in progress: {selectedEvaluation.disruptionReason}
              </div>
            )}

            <div className="detail-metrics">
              {selectedSegment.traffic_weight && (
                <div className="detail-metric">
                  <span className="metric-label">Traffic Impact:</span>
                  <span className="metric-value">
                    {selectedSegment.traffic_weight}/10
                  </span>
                </div>
              )}
              {selectedSegment.moratorium_until_day ? (
                <div className="detail-metric">
                  <span className="metric-label">Moratorium:</span>
                  <span className="metric-value">
                    Until Day {selectedSegment.moratorium_until_day}
                  </span>
                </div>
              ) : null}
              <div className="detail-metric">
                <span className="metric-label">Jobs on Segment:</span>
                <span className="metric-value">
                  {selectedEvaluation.packages.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

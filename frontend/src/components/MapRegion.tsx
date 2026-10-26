import React from "react";
import type { Project, ReplanResult } from "../types";
import { MapView } from "./MapView";

interface MapRegionProps {
  project: Project | null;
  replan?: ReplanResult | null;
  children?: React.ReactNode;
}

export const MapRegion: React.FC<MapRegionProps> = ({
  project,
  replan,
  children,
}) => {
  const segments = project?.segments ?? [];

  return (
    <section className="shell-region region-map" aria-label="District Network Map Region">
      <div className="region-header">
        <div className="region-title-group">
          <span className="region-icon">🗺️</span>
          <h2>District Network Map</h2>
        </div>
        <div className="region-header-meta">
          <span className="region-status-pill success">
            {segments.length} {segments.length === 1 ? "Segment" : "Segments"}
          </span>
        </div>
      </div>

      <div id="map-slot" className="region-content map-slot">
        {children ? (
          children
        ) : segments.length > 0 ? (
          <MapView
            segments={segments}
            packages={project?.packages}
            colocations={project?.colocations}
            replan={replan}
          />
        ) : (
          <div className="slot-placeholder map-placeholder">
            <div className="placeholder-banner">
              <span className="status-dot green"></span>
              <span>Map Slot Ready — Leaflet GIS Layer (Issue #7)</span>
            </div>
            <p className="no-segments-hint">No street segments loaded in current project.</p>
          </div>
        )}
      </div>
    </section>
  );
};

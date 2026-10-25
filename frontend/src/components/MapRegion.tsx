import React from "react";
import type { Project } from "../types";

interface MapRegionProps {
  project: Project | null;
  children?: React.ReactNode;
}

export const MapRegion: React.FC<MapRegionProps> = ({ project, children }) => {
  const segments = project?.segments ?? [];

  return (
    <section className="shell-region region-map" aria-label="District Network Map Region">
      <div className="region-header">
        <div className="region-title-group">
          <span className="region-icon">🗺️</span>
          <h2>District Network Map</h2>
        </div>
        <span className="region-status-pill">
          {segments.length} {segments.length === 1 ? "Segment" : "Segments"}
        </span>
      </div>

      <div id="map-slot" className="region-content map-slot">
        {children ? (
          children
        ) : (
          <div className="slot-placeholder map-placeholder">
            <div className="placeholder-banner">
              <span className="status-dot green"></span>
              <span>Map Slot Ready — Leaflet GIS Layer (Issue #4)</span>
            </div>

            <div className="segment-summary-grid">
              {segments.map((seg) => {
                const pkgsOnSeg =
                  project?.packages.filter((p) => p.segment_id === seg.id) ?? [];
                return (
                  <div key={seg.id} className="segment-card">
                    <div className="segment-card-top">
                      <span className="segment-name">{seg.name}</span>
                      <span className="segment-id">{seg.id}</span>
                    </div>
                    <div className="segment-card-meta">
                      <span>{pkgsOnSeg.length} work packages</span>
                      {seg.traffic_weight && (
                        <span>Traffic: {seg.traffic_weight}/10</span>
                      )}
                      {seg.moratorium_until_day ? (
                        <span className="moratorium-tag">
                          Moratorium until Day {seg.moratorium_until_day}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

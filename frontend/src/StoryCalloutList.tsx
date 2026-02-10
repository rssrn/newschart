import React, { useState, useEffect, useMemo } from "react";
import { Annotation } from "react-simple-maps";
import { calculateOffsets } from "./utils/mapCalloutUtils";
import { StoryCallout, PositionedCallout, ViewportSize, MapProjection } from "./types/news";

interface StoryCalloutListProps {
  readonly projection: MapProjection;
}

function getShowBoundingBox(): boolean {
  const params = new URLSearchParams(window.location.search); // NOSONAR
  return params.get('showBoundingBox') === 'true';
}

function StoryCalloutList({ projection }: StoryCalloutListProps): React.ReactElement {

const [callouts, setCallouts] = useState<StoryCallout[]>([]);
const [viewportSize, setViewportSize] = useState<ViewportSize>({ w: window.innerWidth, h: window.innerHeight });
const showBoundingBox = getShowBoundingBox();

// Track viewport size for visible SVG height calculation
useEffect(() => {
  const handleResize = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight });
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// SVG viewBox is 800×600, rendered at full width. Visible height in SVG coords:
const SVG_WIDTH = 800;
const visibleSvgHeight = Math.min(600, SVG_WIDTH * (viewportSize.h / viewportSize.w));

// Compute bounding box coordinates for debug overlay
// Shows the full area where any part of a box can appear
const boundingBox = useMemo(() => {
  if (!showBoundingBox) return null;
  const EDGE_PADDING = 40;

  const x = EDGE_PADDING;
  const y = EDGE_PADDING;
  const w = SVG_WIDTH - EDGE_PADDING * 2;
  const h = visibleSvgHeight - EDGE_PADDING * 2;
  return { x, y, w, h };
}, [showBoundingBox, visibleSvgHeight]);

// fetch list of callouts from backend
  useEffect(() => {
    const params = new URLSearchParams(window.location.search); // NOSONAR
    const testCase = params.get('testCase');

    const url = testCase === null
      ? `/api/news/calloutsForDay/${new Date().toISOString().split('T')[0]}`
      : `/api/news/sampleCallouts?testCase=${testCase}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data: StoryCallout[]) => {
        setCallouts(data);
      })
      .catch((error) => {
        console.error("Error fetching callouts:", error);
      });
  }, []);

  const processedCallouts: PositionedCallout[] = useMemo(() => {
    // Only run if we have data AND the map context/projection is ready
    if (callouts.length === 0 || !projection) return [];

    return calculateOffsets(callouts, projection, visibleSvgHeight);
  }, [callouts, projection, visibleSvgHeight]);

  return (
  <>
  {boundingBox && (
    <rect
      x={boundingBox.x} y={boundingBox.y}
      width={boundingBox.w} height={boundingBox.h}
      fill="none" stroke="red" strokeWidth={1} strokeDasharray="6 3"
      style={{ pointerEvents: "none" }}
    />
  )}
  {processedCallouts.map((callout) => (
        <Annotation
          key={`${callout.country.name}-${callout.headline}`}
          subject={[callout.country.longitude, callout.country.latitude]}
          dx={callout.dx}
          dy={callout.dy}
          connectorProps={{
            stroke: "#2563EB",
            strokeWidth: 1.5,
            strokeLinecap: "round",
          }}
          style={{ pointerEvents: "none" }}
        >
          <foreignObject
          x={-67.5}
          y={-50}
          width="135"
          height="100"
          style={{ overflow: 'visible' }}>

            <div className="map-annotation-box">
              <div className="map-annotation-header">
                <div className="map-annotation-location">
                  <span className="location-flag">{getCountryFlag(callout.country.iso2)}</span>
                  <span>{callout.country.name}</span>
                </div>
              </div>
              <h4 className="map-annotation-title">{callout.headline}</h4>
              <p className="map-annotation-text">{callout.detail}</p>
              <div className="map-annotation-footer">
                <div className="map-annotation-info">
                  <span className="info-icon">i</span>
                  <span>More details</span>
                </div>
              </div>
            </div>
          </foreignObject>
        </Annotation>
  ))}
  </>
  );

}

function getCountryFlag(countryCode: string | undefined): string {
  if (countryCode?.length === 2) {
    // Convert country code to flag emoji using regional indicator symbols
    // Each letter maps to a regional indicator symbol (🇦 = U+1F1E6, 🇧 = U+1F1E7, etc.)
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.codePointAt(0)!); // 127397 = 0x1F1E6 - 65

    return String.fromCodePoint(...codePoints);
  }

  return '🌍'; // Default globe emoji for unknown/international
}

export default StoryCalloutList;

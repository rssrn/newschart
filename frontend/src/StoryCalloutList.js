import React, { useState, useEffect, useMemo } from "react";

import { Annotation } from "react-simple-maps";

import { calculateOffsets } from "./utils/mapCalloutUtils";


function getShowBoundingBox() {
  const params = new URLSearchParams(window.location.search);
  return params.get('showBoundingBox') === 'true';
}

function StoryCalloutList({ projection }) {

const [callouts, setCallouts] = useState([]);
const [viewportSize, setViewportSize] = useState({ w: window.innerWidth, h: window.innerHeight });
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

// temp logging
const tmpCallouts = useMemo(() => {
  if (callouts.length === 0 || !projection) return [];

  // LOG VIEWPORT INFO
  console.log('=== MAP VIEWPORT INFO ===');

  // Get the bounds of the projection
  const topLeft = projection([-180, 85]);
  const bottomRight = projection([180, -85]);

  console.log('Top-left corner:', topLeft);
  console.log('Bottom-right corner:', bottomRight);
  console.log('Map width:', bottomRight[0] - topLeft[0]);
  console.log('Map height:', bottomRight[1] - topLeft[1]);

  // Also log where each callout's subject point appears on screen
  callouts.forEach((c, i) => {
    const [x, y] = projection([c.country.longitude, c.country.latitude]);
    console.log(`Callout ${i} (${c.headline}): subject at [${x}, ${y}]`);
  });

  return calculateOffsets(callouts, projection);
}, [callouts, projection]);


// fetch list of callouts from backend
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const testCase = params.get('testCase');

    const url = testCase !== null
      ? `/api/news/sampleCallouts?testCase=${testCase}`
      : `/api/news/calloutsForDay/${new Date().toISOString().split('T')[0]}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        setCallouts(data);
      })
      .catch((error) => {
        console.error("Error fetching callouts:", error);
      });
  }, []);

  const processedCallouts = useMemo(() => {
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

function getCountryFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) {
    return '🌍'; // Default globe emoji for unknown/international
  }

  // Convert country code to flag emoji using regional indicator symbols
  // Each letter maps to a regional indicator symbol (🇦 = U+1F1E6, 🇧 = U+1F1E7, etc.)
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0)); // 127397 = 0x1F1E6 - 65

  return String.fromCodePoint(...codePoints);
}

export default StoryCalloutList;

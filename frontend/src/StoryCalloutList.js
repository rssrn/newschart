import React, { useState, useEffect, useMemo } from "react";

import { Annotation } from "react-simple-maps";

import { calculateOffsets } from "./utils/mapCalloutUtils";

function StoryCalloutList({ projection }) {

const [callouts, setCallouts] = useState([]);

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
    const [x, y] = projection([c.latLong.longitude, c.latLong.latitude]);
    console.log(`Callout ${i} (${c.headline}): subject at [${x}, ${y}]`);
  });

  return calculateOffsets(callouts, projection);
}, [callouts, projection]);


// fetch list of callouts from backend
// TODO for now, just fetching sample list
  useEffect(() => {
    // TODO could be useful to have a GUI to switch to e.g. sampleCallouts
    const today = new Date().toISOString().split('T')[0];
    //console.log("TODAY: " + today);
    fetch(`/api/news/calloutsForDay/${today}`)
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        setCallouts(data);
      })
      .catch((error) => {
        console.error("Error fetching callouts:", error);
        // TODO setError("Failed to load callouts");
      });
  }, []);

  const processedCallouts = useMemo(() => {
    // Only run if we have data AND the map context/projection is ready
    if (callouts.length === 0 || !projection) return [];

    // Pass the projection function here:
    return calculateOffsets(callouts, projection);
  }, [callouts, projection]);

  return (
  <>
  {processedCallouts.map((callout) => (
        <Annotation
          subject={[callout.country.longitude, callout.country.latitude]}
          dx={callout.dx + 130} // shift to approx centre of box
          dy={callout.dy + 75} // shift to approx centre of box
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

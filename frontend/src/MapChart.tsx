import React, { useState, useEffect, useMemo } from "react";
import { geoMercator, GeoProjection } from "d3-geo";
import StoryCalloutList from './StoryCalloutList';
import { StoryCallout } from './types/news';
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

// Static projection config - moved outside component to avoid useMemo dependency warning
const projectionConfig: { center: [number, number]; scale: number } = {
  center: [0, -35],
  scale: 90,
};

const ACTIVE_COUNTRY_FILL   = "#FDE68A"; // amber-200
const ACTIVE_COUNTRY_STROKE = "#D97706"; // amber-600
const DEFAULT_FILL          = "#D6D6DA";
const DEFAULT_STROKE        = "#FFFFFF";

interface MapChartProps {
  readonly source: string;
}

// @author Claude Sonnet 4.6 Anthropic
const MapChart = ({ source }: MapChartProps): React.ReactElement => {

  const [callouts, setCallouts] = useState<StoryCallout[]>([]);

  // Must match react-simple-maps' internal projection: translate = [width/2, height/2]
  // where ComposableMap defaults to width=800, height=600
  const projection: GeoProjection = useMemo(() => {
    return geoMercator()
      .center(projectionConfig.center)
      .scale(projectionConfig.scale)
      .translate([400, 300]);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search); // NOSONAR
    const testCase = params.get('testCase');

    const url = testCase === null
      ? `/api/news/calloutsForDay/${new Date().toISOString().split('T')[0]}?source=${source}`
      : `/api/news/sampleCallouts?testCase=${testCase}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data: StoryCallout[]) => setCallouts(data))
      .catch((error) => console.error("Error fetching callouts:", error));
  }, [source]);

  // Build set of ISO numeric codes (as numbers) for active callouts
  const activeIsoNumerics: Set<number> = useMemo(() => {
    const nums = callouts
      .map(c => c.country.isoNumeric)
      .filter((n): n is string => n !== undefined && n !== "")
      .map(n => parseInt(n, 10))
      .filter(n => !isNaN(n));
    return new Set(nums);
  }, [callouts]);

  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={projectionConfig}
      style={{
        width: "100%",
        height: "auto",
      }}
    >
      <Geographies
        geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
        stroke="#FFFFFF"
        strokeWidth={0.5}
        style={{ pointerEvents: "none" }}
      >
        {({ geographies }) =>
          geographies
            .filter((geo) => geo.properties.name !== "Antarctica")
            .map((geo) => {
              const isActive = activeIsoNumerics.has(Number(geo.id));
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isActive ? ACTIVE_COUNTRY_FILL : DEFAULT_FILL}
                  stroke={isActive ? ACTIVE_COUNTRY_STROKE : DEFAULT_STROKE}
                  strokeWidth={isActive ? 0.8 : 0.5}
                />
              );
            })
        }
      </Geographies>
      {/* Annotations handled by StoryCalloutList */}
      <StoryCalloutList projection={projection} callouts={callouts}/>
    </ComposableMap>
  );
};

export default MapChart;

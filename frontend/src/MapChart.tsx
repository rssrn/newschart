import React, { useMemo } from "react";
import { geoMercator, GeoProjection } from "d3-geo";
import StoryCalloutList from './StoryCalloutList';
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

interface MapChartProps {
  readonly source: string;
}

// @author Claude Sonnet 4.6 Anthropic
const MapChart = ({ source }: MapChartProps): React.ReactElement => {

  // Must match react-simple-maps' internal projection: translate = [width/2, height/2]
  // where ComposableMap defaults to width=800, height=600
  const projection: GeoProjection = useMemo(() => {
    return geoMercator()
      .center(projectionConfig.center)
      .scale(projectionConfig.scale)
      .translate([400, 300]);
  }, []);

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
        fill="#D6D6DA"
        stroke="#FFFFFF"
        strokeWidth={0.5}
        style={{ pointerEvents: "none" }}
      >
        {({ geographies }) =>
          geographies
            .filter((geo) => geo.properties.name !== "Antarctica")
            .map((geo) => (
              <Geography key={geo.rsmKey} geography={geo} />
          ))
        }
      </Geographies>
      {/* Annotations handled by StoryCalloutList */}
      <StoryCalloutList projection={projection} source={source}/>
    </ComposableMap>
  );
};

export default MapChart;

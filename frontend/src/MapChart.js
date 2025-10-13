import React from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Annotation,
  ZoomableGroup,
} from "react-simple-maps";

const MapChart = () => {
  return (
    <ComposableMap
      projection="geoMercator" // alternative: geoEqualEarth
      projectionConfig={{
        //rotate: [-10.0, -52.0, 0],
        center: [0, 10],
        scale: 100,
      }}
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
      <Annotation
        subject={[2.3522, 48.8566]}
        dx={110}
        dy={30}
        connectorProps={{
          stroke: "#FF5533",
          strokeWidth: 2,
          strokeLinecap: "round",
        }}
        style={{ pointerEvents: "none" }}
      >
        <foreignObject width="200" height="auto" style={{ overflow: 'visible' }}>
          <div className="map-annotation-box">
            <h4 className="map-annotation-title">France News</h4>
            <p className="map-annotation-text">
              Sample news from France.   No doubt it's related to politics, art, fashion, gastronomy, and/or culture.
            </p>
          </div>
        </foreignObject>
      </Annotation>
    </ComposableMap>
  );
};

export default MapChart;

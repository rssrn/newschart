import React, { useState, useEffect, useMemo } from "react";
import { geoMercator, geoNaturalEarth1, geoEqualEarth, geoEquirectangular, GeoProjection } from "d3-geo";
import StoryCalloutList from './StoryCalloutList';
import { StoryCallout } from './types/news';
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

// @author Claude Sonnet 4.6 Anthropic
export type ProjectionType = 'geoMercator' | 'geoNaturalEarth1' | 'geoEqualEarth' | 'geoEquirectangular';
// @author Claude Sonnet 4.6 Anthropic
export type FetchStatus = 'loading' | 'error' | 'success';

export interface ProjectionOption {
  readonly value: ProjectionType;
  readonly label: string;
  readonly d3Constructor: () => GeoProjection;
  readonly config: { center: [number, number]; scale: number };
}

export const PROJECTION_OPTIONS: ProjectionOption[] = [
  { value: 'geoMercator',       label: 'Mercator',       d3Constructor: geoMercator,       config: { center: [0, -25], scale: 90  } },
  { value: 'geoNaturalEarth1',  label: 'Natural Earth',  d3Constructor: geoNaturalEarth1,  config: { center: [0, -28], scale: 153 } },
  { value: 'geoEqualEarth',     label: 'Equal Earth',    d3Constructor: geoEqualEarth,     config: { center: [0, -28], scale: 153 } },
];
];

const ACTIVE_COUNTRY_FILL   = "#FDE68A"; // amber-200
const ACTIVE_COUNTRY_STROKE = "#D97706"; // amber-600
const DEFAULT_FILL          = "#D6D6DA";
const DEFAULT_STROKE        = "#FFFFFF";

interface MapChartProps {
  readonly source: string;
  readonly projectionType: ProjectionType;
  readonly onFetchStatus?: (status: FetchStatus) => void;
  readonly date: string;
  readonly bottomReservedPx?: number;
}

// @author Claude Sonnet 4.6 Anthropic
const calloutsCache = new Map<string, StoryCallout[]>();

// @author Claude Sonnet 4.6 Anthropic
const MapChart = ({ source, projectionType, onFetchStatus, date, bottomReservedPx = 0 }: MapChartProps): React.ReactElement => {

  const [callouts, setCallouts] = useState<StoryCallout[]>([]);

  // Stable ref so the fetch effect doesn't re-run when parent re-renders the callback
  const onFetchStatusRef = React.useRef(onFetchStatus);
  useEffect(() => { onFetchStatusRef.current = onFetchStatus; }, [onFetchStatus]);

  const projectionOption = useMemo(
    () => PROJECTION_OPTIONS.find(p => p.value === projectionType) ?? PROJECTION_OPTIONS[0],
    [projectionType]
  );

  // Must match react-simple-maps' internal projection: translate = [width/2, height/2]
  // where ComposableMap defaults to width=800, height=600
  const projection: GeoProjection = useMemo(() => {
    return projectionOption.d3Constructor()
      .center(projectionOption.config.center)
      .scale(projectionOption.config.scale)
      .translate([400, 300]);
  }, [projectionOption]);

  // @author Claude Sonnet 4.6 Anthropic
  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams(window.location.search); // NOSONAR
    const testCase = params.get('testCase');

    const url = testCase === null
      ? `/api/news/calloutsForDay/${date}?source=${source}`
      : `/api/news/sampleCallouts?testCase=${testCase}`;

    const cached = calloutsCache.get(url);
    if (cached) {
      setCallouts(cached);
      onFetchStatusRef.current?.('success');
      return;
    }

    setCallouts([]);
    onFetchStatusRef.current?.('loading');

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data: StoryCallout[]) => {
        calloutsCache.set(url, data);
        setCallouts(data);
        onFetchStatusRef.current?.('success');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        console.error("Error fetching callouts:", error);
        onFetchStatusRef.current?.('error');
      });

    return () => controller.abort();
  }, [source, date]);

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
      projection={projectionType}
      projectionConfig={projectionOption.config}
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
      <StoryCalloutList projection={projection} callouts={callouts} bottomReservedPx={bottomReservedPx}/>
    </ComposableMap>
  );
};

export default MapChart;

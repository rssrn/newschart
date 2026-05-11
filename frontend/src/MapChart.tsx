import React, { useState, useEffect, useMemo } from "react";
import { GeoProjection } from "d3-geo";
import StoryCalloutList from './StoryCalloutList';
import { StoryCallout } from './types/news';
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { ProjectionType, FetchStatus, PROJECTION_OPTIONS } from './utils/projectionOptions';
import { track } from './utils/analytics';

export type { ProjectionType, FetchStatus };

// @author Claude Opus 4.6 Anthropic
const ACTIVE_COUNTRY_FILL_CURRENT      = "#1d4ed8"; // blue-700 — visible on dark map
const ACTIVE_COUNTRY_STROKE_CURRENT    = "#60a5fa"; // blue-400 — bright on dark
const ACTIVE_COUNTRY_FILL_HISTORICAL   = "#854d0e"; // amber-800 — warm on dark
const ACTIVE_COUNTRY_STROKE_HISTORICAL = "#fbbf24"; // amber-400 — bright on dark
const DEFAULT_FILL                     = "#1e2d3d"; // dark blue-grey land
const DEFAULT_STROKE                   = "#2d4257"; // subtle border

interface MapChartProps {
  readonly source: string;
  readonly projectionType: ProjectionType;
  readonly onFetchStatus?: (status: FetchStatus) => void;
  readonly date: string;
  readonly bottomReservedPx?: number;
  readonly isHistorical?: boolean;
}

// @author Claude Sonnet 4.6 Anthropic
const calloutsCache = new Map<string, StoryCallout[]>();

// @author Claude Sonnet 4.6 Anthropic
const MapChart = ({ source, projectionType, onFetchStatus, date, bottomReservedPx = 0, isHistorical = false }: MapChartProps): React.ReactElement => {

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
      Promise.resolve(cached).then(data => {
        if (controller.signal.aborted) return;
        setCallouts(data);
        onFetchStatusRef.current?.('success');
        if (testCase === null) track('news_loaded', { source, date, callout_count: data.length, cached: true });
      });
      return;
    }

    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setCallouts([]);
      onFetchStatusRef.current?.('loading');
    });

    const fetchStart = performance.now();
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data: StoryCallout[]) => {
        calloutsCache.set(url, data);
        setCallouts(data);
        onFetchStatusRef.current?.('success');
        if (testCase === null) track('news_loaded', { source, date, callout_count: data.length, cached: false, duration_ms: Math.round(performance.now() - fetchStart) });
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        console.error("Error fetching callouts:", error);
        onFetchStatusRef.current?.('error');
        if (testCase === null) track('news_load_failed', { source, date });
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
        stroke="#2d4257"
        strokeWidth={0.5}
        style={{ pointerEvents: "none" }}
      >
        {({ geographies }) =>
          geographies
            .filter((geo) => geo.properties.name !== "Antarctica")
            .map((geo) => {
              const isActive = activeIsoNumerics.has(Number(geo.id));
              const activeFill = isHistorical ? ACTIVE_COUNTRY_FILL_HISTORICAL : ACTIVE_COUNTRY_FILL_CURRENT;
              const activeStroke = isHistorical ? ACTIVE_COUNTRY_STROKE_HISTORICAL : ACTIVE_COUNTRY_STROKE_CURRENT;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isActive ? activeFill : DEFAULT_FILL}
                  stroke={isActive ? activeStroke : DEFAULT_STROKE}
                  strokeWidth={isActive ? 0.8 : 0.5}
                  tabIndex={-1}
                />
              );
            })
        }
      </Geographies>
      {/* Annotations handled by StoryCalloutList */}
      <StoryCalloutList projection={projection} callouts={callouts} bottomReservedPx={bottomReservedPx} isHistorical={isHistorical}/>
    </ComposableMap>
  );
};

export default MapChart;

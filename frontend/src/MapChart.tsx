import React, { useState, useEffect, useMemo } from "react";
import { GeoProjection, geoPath } from "d3-geo";
import StoryCalloutList from './StoryCalloutList';
import { StoryCallout, CalloutStat } from './types/news';
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { ProjectionType, FetchStatus, PROJECTION_OPTIONS } from './utils/projectionOptions';
import { track } from './utils/analytics';
import iso2ToNumeric from './utils/iso2ToNumeric';
import { heatmapColor } from './utils/heatmapUtils';

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
  readonly viewMode?: 'day' | 'heatmap';
  readonly heatmapStats?: CalloutStat[];
}


// @author Claude Sonnet 4.6 Anthropic
const calloutsCache = new Map<string, StoryCallout[]>();

// @author Claude Sonnet 4.6 Anthropic
const MapChart = ({ source, projectionType, onFetchStatus, date, bottomReservedPx = 0, isHistorical = false, viewMode = 'day', heatmapStats = [] }: MapChartProps): React.ReactElement => {

  const [callouts, setCallouts] = useState<StoryCallout[]>([]);
  const [hoveredGeoKey, setHoveredGeoKey] = useState<string | null>(null);

  interface HoverTooltip { x: number; y: number; name: string; count: number; iso2: string; }
  const [hoveredTooltip, setHoveredTooltip] = useState<HoverTooltip | null>(null);

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
        if (data.length > 0) calloutsCache.set(url, data);
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

  // @author Claude Sonnet 4.6 Anthropic
  const heatmapData = useMemo(() => {
    if (viewMode !== 'heatmap' || heatmapStats.length === 0) return null;
    const globalMax = Math.max(...heatmapStats.map(s => s.count), 1);
    const countByNumeric = new Map<number, number>();
    heatmapStats
      .filter(s => s.source === source)
      .forEach(s => {
        const num = iso2ToNumeric[s.countryCode];
        if (num !== undefined) countByNumeric.set(num, s.count);
      });
    return { countByNumeric, globalMax };
  }, [viewMode, heatmapStats, source]);

  // @author Claude Sonnet 4.6 Anthropic
  const numericToIso2 = useMemo(() => {
    const rev: Record<number, string> = {};
    for (const [code, num] of Object.entries(iso2ToNumeric)) rev[num] = code;
    return rev;
  }, []);

  const heatmapPathGen = useMemo(
    () => heatmapData ? geoPath().projection(projection) : null,
    [heatmapData, projection]
  );

  return (
    <div style={{ position: 'relative' }}>
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
        style={heatmapData ? undefined : { pointerEvents: "none" }}
      >
        {({ geographies }) => {
          // @author Claude Sonnet 4.6 Anthropic
          const filtered = geographies.filter((geo) => geo.properties.name !== "Antarctica");

          return filtered.map((geo) => {
            if (heatmapData) {
              const count = heatmapData.countByNumeric.get(Number(geo.id)) ?? 0;
              const fill = count > 0 ? heatmapColor(count, heatmapData.globalMax) : DEFAULT_FILL;
              const t = count > 0 ? Math.sqrt(count / heatmapData.globalMax) : 0;
              const glowPx = count > 0 ? 2 + t * 9 : 0;
              const isHovered = count > 0 && geo.rsmKey === hoveredGeoKey;

              const glow = count > 0
                ? `drop-shadow(0 0 ${(isHovered ? glowPx * 1.6 : glowPx).toFixed(1)}px rgba(234,88,12,0.75))`
                : undefined;
              const animation = t > 0.6
                ? 'heatPulseHot 2s ease-in-out infinite'
                : t > 0.3
                  ? 'heatPulseMid 3.5s ease-in-out infinite'
                  : 'none';

              const geoStyle = { filter: glow, animation };
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke={isHovered ? '#fb923c' : count > 0 ? '#c2410c60' : DEFAULT_STROKE}
                  strokeWidth={isHovered ? 1.5 : count > 0 ? 0.8 : 0.5}
                  style={{ default: geoStyle, hover: geoStyle }}
                  onMouseEnter={count > 0 ? () => {
                    setHoveredGeoKey(geo.rsmKey);
                    if (heatmapPathGen) {
                      const [cx, cy] = heatmapPathGen.centroid(geo);
                      if (isFinite(cx) && isFinite(cy)) {
                        const iso2 = numericToIso2[Number(geo.id)] ?? '';
                        setHoveredTooltip({ x: cx, y: cy, name: geo.properties.name as string, count, iso2 });
                      }
                    }
                  } : undefined}
                  onMouseLeave={count > 0 ? () => { setHoveredGeoKey(null); setHoveredTooltip(null); } : undefined}
                  tabIndex={-1}
                />
              );
            }
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
                style={{ default: { pointerEvents: 'none' } }}
                tabIndex={-1}
              />
            );
          });
        }}
      </Geographies>
      {/* Annotations hidden in heatmap mode */}
      {viewMode !== 'heatmap' && (
        <StoryCalloutList projection={projection} callouts={callouts} bottomReservedPx={bottomReservedPx} isHistorical={isHistorical}/>
      )}
    </ComposableMap>
    {/* @author Claude Sonnet 4.6 Anthropic */}
    {hoveredTooltip && (() => {
      const flag = hoveredTooltip.iso2
        ? [...hoveredTooltip.iso2.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
        : '';
      return (
        <div style={{
          position: 'absolute',
          left: `${(hoveredTooltip.x / 800) * 100}%`,
          top: `${(hoveredTooltip.y / 600) * 100}%`,
          transform: 'translate(-50%, calc(-100% - 10px))',
          pointerEvents: 'none',
          zIndex: 10,
          background: 'rgba(8, 18, 32, 0.93)',
          border: '1px solid rgba(251, 146, 60, 0.5)',
          borderRadius: '10px',
          padding: '8px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          <div style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em' }}>
            {flag && <span style={{ marginRight: '5px' }}>{flag}</span>}{hoveredTooltip.name}
          </div>
          <div style={{ color: '#fb923c', fontSize: '12px', fontWeight: 500 }}>
            {hoveredTooltip.count} {hoveredTooltip.count === 1 ? 'story' : 'stories'}
          </div>
        </div>
      );
    })()}
    </div>
  );
};

export default MapChart;

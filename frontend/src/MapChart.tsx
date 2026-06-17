import React, { useState, useEffect, useMemo } from "react";
import { GeoProjection, geoPath } from "d3-geo";
import StoryCalloutList from './StoryCalloutList';
import { ConsensusChip } from './components/ConsensusChip';
import { StoryCallout, CalloutStat, ViewportSize } from './types/news';
import { useWorldCountries } from './utils/useWorldCountries';
import { ProjectionType, FetchStatus, PROJECTION_OPTIONS } from './utils/projectionOptions';
import { track } from './utils/analytics';
import iso2ToNumeric from './utils/iso2ToNumeric';
import { heatmapColor } from './utils/heatmapUtils';
import { groupByCountry, fullSizeTier, pickDisplayCallout, chipTier, resolveDisplay, ConsensusGroup, ConsensusRenderCallout } from './utils/consensus';
import { placeChips } from './utils/chipLayout';
import { calculateOffsets, BOX_WIDTH, BOX_VISUAL_TOP } from './utils/mapCalloutUtils';
import { EventInspectorModal } from './components/EventInspectorModal';
import type { CalloutSource } from './utils/sources';
import { SOURCE_ORDER } from './utils/sources';

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
  readonly viewMode?: 'day' | 'heatmap' | 'consensus';
  readonly heatmapStats?: CalloutStat[];
  readonly onCountryClick?: (iso2: string, name: string, count: number) => void;
  readonly onCalloutsLoaded?: (callouts: StoryCallout[]) => void;
  readonly retryKey?: number;
  readonly highlightSource?: CalloutSource | null;
}


// @author Claude Sonnet 4.6 Anthropic
const calloutsCache = new Map<string, StoryCallout[]>();

// @author Claude Sonnet 4.6 Anthropic
const MapChart = ({ source, projectionType, onFetchStatus, date, bottomReservedPx = 0, isHistorical = false, viewMode = 'day', heatmapStats = [], onCountryClick, onCalloutsLoaded, retryKey, highlightSource = null }: MapChartProps): React.ReactElement => {

  const [callouts, setCallouts] = useState<StoryCallout[]>([]);
  const [hoveredGeoKey, setHoveredGeoKey] = useState<string | null>(null);

  interface HoverTooltip { x: number; y: number; name: string; count: number; iso2: string; }
  const [hoveredTooltip, setHoveredTooltip] = useState<HoverTooltip | null>(null);
  const hideTooltipTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHideTooltip = () => {
    hideTooltipTimer.current = setTimeout(() => {
      setHoveredGeoKey(null);
      setHoveredTooltip(null);
    }, 150);
  };
  const cancelHideTooltip = () => {
    if (hideTooltipTimer.current) clearTimeout(hideTooltipTimer.current);
  };

  // Stable ref so the fetch effect doesn't re-run when parent re-renders the callback
  const onFetchStatusRef = React.useRef(onFetchStatus);
  useEffect(() => { onFetchStatusRef.current = onFetchStatus; }, [onFetchStatus]);

  const onCalloutsLoadedRef = React.useRef(onCalloutsLoaded);
  useEffect(() => { onCalloutsLoadedRef.current = onCalloutsLoaded; }, [onCalloutsLoaded]);

  const projectionOption = useMemo(
    () => PROJECTION_OPTIONS.find(p => p.value === projectionType) ?? PROJECTION_OPTIONS[0],
    [projectionType]
  );

  const projection: GeoProjection = useMemo(() => {
    return projectionOption.d3Constructor()
      .center(projectionOption.config.center)
      .scale(projectionOption.config.scale)
      .translate([400, 300]);
  }, [projectionOption]);

  const countries = useWorldCountries();

  const pathGen = useMemo(() => geoPath(projection), [projection]);

  // @author Claude Sonnet 4.6 Anthropic
  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams(window.location.search); // NOSONAR
    const testCase = params.get('testCase');

    const isConsensus = viewMode === 'consensus';
    const url = testCase === null
      ? isConsensus
        ? `/api/news/calloutsForDay/${date}`
        : `/api/news/calloutsForDay/${date}?source=${source}`
      : `/api/news/sampleCallouts?testCase=${testCase}`;

    const cached = calloutsCache.get(url);
    if (cached) {
      Promise.resolve(cached).then(data => {
        if (controller.signal.aborted) return;
        setCallouts(data);
        onCalloutsLoadedRef.current?.(data);
        onFetchStatusRef.current?.('success');
        if (testCase === null) track('news_loaded', { source, date, callout_count: data.length, cached: true });
      });
      return;
    }

    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setCallouts([]);
      onCalloutsLoadedRef.current?.([]);
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
        onCalloutsLoadedRef.current?.(data);
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
  }, [source, date, retryKey, viewMode]);

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
  const calloutsInView: StoryCallout[] = useMemo(() => {
    if (viewMode !== 'consensus') return callouts;
    const groups = groupByCountry(callouts);
    const tier = fullSizeTier(groups, 4);
    return tier.map(group => {
      const display = { ...pickDisplayCallout(group) };
      display.consensus = { sourcesFiled: [...group.sourcesFiled], count: group.consensusCount };
      return display;
    });
  }, [viewMode, callouts]);

  // @author Claude Sonnet 4.6 Anthropic
  // Highlight-aware render callouts — swaps headline/detail per the active highlight.
  // Re-computed on highlight change but NOT used for layout (positions stay stable).
  const consensusRenderCallouts: ConsensusRenderCallout[] = useMemo(() => {
    if (viewMode !== 'consensus') return [];
    const groups = groupByCountry(callouts);
    const tier = fullSizeTier(groups, 4);
    return tier.map(group => {
      const { callout, voiceSource, highlightFiled } = resolveDisplay(group, highlightSource);
      return {
        ...callout,
        consensus: { sourcesFiled: [...group.sourcesFiled], count: group.consensusCount },
        voiceSource,
        highlightFiled,
      };
    });
  }, [callouts, viewMode, highlightSource]);

  // @author Claude Sonnet 4.6 Anthropic
  // Countries not in the full-size tier (single-story, or beyond the cap) still have map
  // markers; pass one representative callout per such country as obstacles so the layout
  // algorithm avoids placing consensus callout boxes over their origin points.
  const obstacleCallouts: StoryCallout[] = useMemo(() => {
    if (viewMode !== 'consensus') return [];
    const groups = groupByCountry(callouts);
    const tier = fullSizeTier(groups, 4);
    const tierCodes = new Set(tier.map(g => g.country.iso2));
    return groups
      .filter(g => !tierCodes.has(g.country.iso2))
      .map(g => pickDisplayCallout(g));
  }, [viewMode, callouts]);

  // @author Claude Sonnet 4.6 Anthropic
  const [inspectorGroup, setInspectorGroup] = useState<ConsensusGroup | null>(null);
  const [inspectorTrigger, setInspectorTrigger] = useState<'callout_box' | 'chip'>('callout_box');

  // @author Claude Sonnet 4.6 Anthropic
  const presentSources: CalloutSource[] = useMemo(() =>
    SOURCE_ORDER.filter(src => callouts.some(c => c.source === src)),
  [callouts]);

  // @author Claude Sonnet 4.6 Anthropic
  const consensusGroupMap = useMemo(() => {
    const map = new Map<string, ConsensusGroup>();
    if (viewMode === 'consensus') groupByCountry(callouts).forEach(g => map.set(g.country.iso2, g));
    return map;
  }, [callouts, viewMode]);

  // @author Claude Sonnet 4.6 Anthropic
  const [viewportSize, setViewportSize] = useState<ViewportSize>({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const SVG_WIDTH = 800;
  const visibleSvgHeight = Math.min(600, SVG_WIDTH * (viewportSize.h / viewportSize.w));
  const bottomPaddingSvg = bottomReservedPx * (SVG_WIDTH / viewportSize.w);

  // @author Claude Sonnet 4.6 Anthropic
  const chipGroups: ConsensusGroup[] = useMemo(() => {
    if (viewMode !== 'consensus') return [];
    const groups = groupByCountry(callouts);
    const tier = fullSizeTier(groups, 4);
    return chipTier(groups, tier);
  }, [viewMode, callouts]);

  // @author Claude Sonnet 4.6 Anthropic
  const fullSizePositions = useMemo(() => {
    if (viewMode !== 'consensus' || !calloutsInView.length) return [];
    const obstacles = obstacleCallouts
      .map(c => projection([c.country.longitude, c.country.latitude]))
      .filter((pt): pt is [number, number] => pt !== null)
      .map(([x, y]) => ({ x, y }));
    return calculateOffsets(calloutsInView, projection, visibleSvgHeight, bottomPaddingSvg, obstacles);
  }, [viewMode, calloutsInView, obstacleCallouts, projection, visibleSvgHeight, bottomPaddingSvg]);

  const placedChips = useMemo(() => {
    if (viewMode !== 'consensus') return [];

    const fullSizeBoxes = calloutsInView.map((c, i) => {
      const [px, py] = projection([c.country.longitude, c.country.latitude]) ?? [0, 0];
      return { x: px + (fullSizePositions[i]?.dx ?? 0) - BOX_WIDTH / 2, y: py + (fullSizePositions[i]?.dy ?? 0) - BOX_VISUAL_TOP };
    });

    const connectors = calloutsInView.map((c, i) => {
      const proj = projection([c.country.longitude, c.country.latitude]);
      if (!proj) return null;
      const [ox, oy] = proj;
      return { x0: ox + (fullSizePositions[i]?.dx ?? 0), y0: oy + (fullSizePositions[i]?.dy ?? 0), x1: ox, y1: oy };
    }).filter((conn): conn is NonNullable<typeof conn> => conn !== null);

    return placeChips(chipGroups, projection, fullSizeBoxes, connectors, 800, visibleSvgHeight);
  }, [viewMode, calloutsInView, chipGroups, projection, fullSizePositions, visibleSvgHeight]);

  // @author Claude Sonnet 4.6 Anthropic
  const numericToIso2 = useMemo(() => {
    const rev: Record<number, string> = {};
    for (const [code, num] of Object.entries(iso2ToNumeric)) rev[num] = code;
    return rev;
  }, []);

  return (
    <div style={{ position: 'relative' }}>
    <svg viewBox="0 0 800 600" className="geo-svg" style={{ width: '100%', height: 'auto' }}>
      <g style={heatmapData ? undefined : { pointerEvents: 'none' }}>
        {countries.filter(geo => geo.properties?.name !== 'Antarctica').map((geo, geoIdx) => {
          if (heatmapData) {
            const count = heatmapData.countByNumeric.get(Number(geo.id)) ?? 0;
            const fill = count > 0 ? heatmapColor(count, heatmapData.globalMax) : DEFAULT_FILL;
            const t = count > 0 ? Math.sqrt(count / heatmapData.globalMax) : 0;
            const glowPx = count > 0 ? 2 + t * 9 : 0;
            const isHovered = count > 0 && String(geo.id) === hoveredGeoKey;

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
              <path
                key={String(geo.id ?? geoIdx)}
                className="geo-country"
                d={pathGen(geo) ?? undefined}
                fill={fill}
                stroke={isHovered ? '#fb923c' : count > 0 ? '#c2410c60' : DEFAULT_STROKE}
                strokeWidth={isHovered ? 1.5 : count > 0 ? 0.8 : 0.5}
                style={geoStyle}
                onMouseEnter={count > 0 ? () => {
                  if (window.matchMedia('(hover: none)').matches) return;
                  setHoveredGeoKey(String(geo.id));
                  const [cx, cy] = pathGen.centroid(geo);
                  if (isFinite(cx) && isFinite(cy)) {
                    const iso2 = numericToIso2[Number(geo.id)] ?? '';
                    setHoveredTooltip({ x: cx, y: cy, name: geo.properties?.name as string, count, iso2 });
                  }
                } : undefined}
                onMouseLeave={count > 0 ? scheduleHideTooltip : undefined}
                onClick={count > 0 ? () => {
                  const iso2 = numericToIso2[Number(geo.id)] ?? '';
                  onCountryClick?.(iso2, geo.properties?.name as string, count);
                } : undefined}
                tabIndex={-1}
              />
            );
          }
          const isActive = viewMode !== 'heatmap' && activeIsoNumerics.has(Number(geo.id));
          const activeFill = isHistorical ? ACTIVE_COUNTRY_FILL_HISTORICAL : ACTIVE_COUNTRY_FILL_CURRENT;
          const activeStroke = isHistorical ? ACTIVE_COUNTRY_STROKE_HISTORICAL : ACTIVE_COUNTRY_STROKE_CURRENT;
          return (
            <path
              key={String(geo.id ?? geoIdx)}
              className="geo-country"
              d={pathGen(geo) ?? undefined}
              fill={isActive ? activeFill : DEFAULT_FILL}
              stroke={isActive ? activeStroke : DEFAULT_STROKE}
              strokeWidth={isActive ? 0.8 : 0.5}
              style={{ pointerEvents: 'none' }}
              tabIndex={-1}
            />
          );
        })}
      </g>
      {viewMode !== 'heatmap' && (
        <StoryCalloutList
          projection={projection}
          callouts={viewMode === 'consensus' ? consensusRenderCallouts : calloutsInView}
          obstacleCallouts={obstacleCallouts}
          bottomReservedPx={bottomReservedPx}
          isHistorical={isHistorical}
          consensus={viewMode === 'consensus'}
          precomputedOffsets={viewMode === 'consensus' ? fullSizePositions : undefined}
          highlightSource={viewMode === 'consensus' ? highlightSource : null}
          presentSources={viewMode === 'consensus' ? presentSources : undefined}
          onConsensusBoxClick={(callout) => {
            const g = consensusGroupMap.get(callout.country.iso2);
            if (g) { setInspectorTrigger('callout_box'); setInspectorGroup(g); }
          }}
        />
      )}
      {viewMode === 'consensus' && placedChips.map(chip => (
        <ConsensusChip
          key={chip.group.country.iso2}
          group={chip.group}
          x={chip.x}
          y={chip.y}
          isHistorical={isHistorical}
          highlight={highlightSource}
          onClick={(group) => { setInspectorTrigger('chip'); setInspectorGroup(group); }}
        />
      ))}
    </svg>
    {/* @author Claude Sonnet 4.6 Anthropic */}
    {hoveredTooltip && (() => {
      const flag = hoveredTooltip.iso2
        ? [...hoveredTooltip.iso2.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
        : '';
      return (
        <div
          onMouseEnter={cancelHideTooltip}
          onMouseLeave={() => { setHoveredGeoKey(null); setHoveredTooltip(null); }}
          onClick={() => onCountryClick?.(hoveredTooltip.iso2, hoveredTooltip.name, hoveredTooltip.count)}
          style={{
            position: 'absolute',
            left: `${(hoveredTooltip.x / 800) * 100}%`,
            top: `${(hoveredTooltip.y / 600) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 10px))',
            cursor: 'pointer',
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
          <div style={{ color: '#fb923c', fontSize: '12px', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
            {hoveredTooltip.count} {hoveredTooltip.count === 1 ? 'story' : 'stories'}
          </div>
        </div>
      );
    })()}
    {inspectorGroup && (
      <EventInspectorModal
        group={inspectorGroup}
        allCallouts={callouts}
        presentSources={presentSources}
        isHistorical={isHistorical}
        trigger={inspectorTrigger}
        onClose={() => setInspectorGroup(null)}
      />
    )}
    </div>
  );
};

export default MapChart;

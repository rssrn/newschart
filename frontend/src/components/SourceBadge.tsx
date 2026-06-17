// @author Claude Sonnet 4.6 Anthropic
import React from 'react';
import { SOURCE_META } from '../utils/sources';
import type { CalloutSource } from '../utils/sources';

// HTML variant — renders a <span> matching the .consensus-badge CSS class.
// Used in full-size callout badge rows (StoryCalloutList, foreignObject context).
export function SourceBadgeHtml({
  source,
  filled,
  size = 9,
  className,
}: {
  source: CalloutSource;
  filled: boolean;
  size?: number;
  className?: string;
}): React.ReactElement {
  const meta = SOURCE_META[source];
  return (
    <span
      role="img"
      className={`consensus-badge${className ? ` ${className}` : ''}`}
      style={{
        borderColor: '#ffffff',
        backgroundColor: '#ffffff',
        color: meta.color,
        opacity: filled ? 1 : 0.04,
      }}
      title={meta.label}
      aria-label={`${meta.shortLabel}: ${filled ? 'covered' : 'not covered'}`}
    >
      {meta.svgPath ? (
        <svg viewBox={meta.svgViewBox ?? '0 0 24 24'} width={size} height={size} fill="currentColor" aria-hidden="true">
          <path d={meta.svgPath} />
        </svg>
      ) : (<span style={{ fontSize: Math.round(size * 1.4) }} aria-hidden="true">{meta.letter}</span>)}
    </span>
  );
}

// SVG variant — renders a circular white-backed icon at (x, y) in SVG space.
// Used in ConsensusChip (pure SVG context).
export function SourceBadgeSvg({
  source,
  x,
  y,
  size = 14,
}: {
  source: CalloutSource;
  x: number;
  y: number;
  size?: number;
}): React.ReactElement {
  const meta = SOURCE_META[source];
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;
  // useId gives a stable unique ID per component instance, avoiding clipPath
  // collisions when the same source badge renders on multiple chips.
  const uid = React.useId();
  const clipId = `bsc-${uid}`;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#ffffff" />
      {meta.svgPath ? (
        // clipPath lives inside the nested <svg> so its coordinates (0,0)-(size,size)
        // are unambiguously in that viewport — no ancestor-transform confusion.
        <svg x={x} y={y} viewBox={`0 0 ${size} ${size}`} width={size} height={size} overflow="hidden" aria-hidden="true">
          <defs>
            <clipPath id={clipId}>
              <circle cx={r} cy={r} r={r} />
            </clipPath>
          </defs>
          <svg viewBox={meta.svgViewBox ?? '0 0 24 24'} width={size} height={size} fill={meta.color} clipPath={`url(#${clipId})`}>
            <path d={meta.svgPath} />
          </svg>
        </svg>
      ) : (
        <text
          x={cx}
          y={cy}
          fill={meta.color}
          fontSize={size * 0.65}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontWeight="600"
          aria-hidden="true"
        >
          {meta.letter}
        </text>
      )}
    </g>
  );
}

// Independent geometry evaluator for the callout layout algorithm.
// MUST NOT import anything from mapCalloutUtils.ts — it re-derives all geometry
// with its own primitives so that algorithm bugs cannot hide.
//
// @author Claude Sonnet 4.6 Anthropic

import { StoryCallout, PositionedCallout, MapProjection } from '../../types/news';
import { ViewportParams } from './viewports';

// Box constants — must match mapCalloutUtils.ts but are declared independently.
const BOX_WIDTH = 135;
export const RENDERED_HEIGHT = 140; // exposed as tunable to probe sensitivity
const ANCHOR_Y = 50;
const EDGE_PADDING = 40;
const TOP_PADDING = 20;
const SVG_WIDTH = 800;
const BOX_GAP_MIN = 10; // algorithm's minimum gap between boxes (pad in boxesOverlap)

interface Point {
  x: number;
  y: number;
}

interface BoxRect {
  x: number; // top-left x
  y: number; // top-left y
  w: number;
  h: number;
}

export interface Violation {
  type: 'box-overlap' | 'out-of-bounds' | 'connector-cross' | 'connector-through-box' | 'origin-obscured';
  calloutA: string;
  calloutB?: string;
  detail: string;
  measured?: number;
  limit?: number;
}

export interface EvalMetrics {
  totalConnectorLength: number;
  maxConnectorLength: number;
  minOriginClearance: number;   // min distance from box edge to nearest origin (across all boxes)
  minBoxBoxGap: number;         // min actual gap between any two boxes
  angularSpread: number;        // min pairwise angle between connectors (radians)
  originsOffscreen: number;     // count of origins projecting outside SVG_WIDTH×visibleSvgHeight
  nearMissCount: number;        // gaps within 5px of a hard limit
}

export interface EvalResult {
  pass: boolean;
  violations: Violation[];
  metrics: EvalMetrics;
}

// --- Geometry primitives ---

function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(denom) < 0.001) return false;
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
  const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom;
  return t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99;
}

function lineIntersectsBox(p1: Point, p2: Point, box: BoxRect): boolean {
  const pad = 5;
  const bx = box.x - pad;
  const by = box.y - pad;
  const bw = box.w + pad * 2;
  const bh = box.h + pad * 2;
  return segmentsIntersect(p1, p2, { x: bx, y: by }, { x: bx + bw, y: by }) ||
         segmentsIntersect(p1, p2, { x: bx + bw, y: by }, { x: bx + bw, y: by + bh }) ||
         segmentsIntersect(p1, p2, { x: bx + bw, y: by + bh }, { x: bx, y: by + bh }) ||
         segmentsIntersect(p1, p2, { x: bx, y: by + bh }, { x: bx, y: by });
}

function boxesOverlapWithGap(a: BoxRect, b: BoxRect, gap: number): boolean {
  return a.x < b.x + b.w + gap &&
         a.x + a.w + gap > b.x &&
         a.y < b.y + b.h + gap &&
         a.y + a.h + gap > b.y;
}

function pointInBox(p: Point, box: BoxRect, pad = 0): boolean {
  return p.x > box.x - pad && p.x < box.x + box.w + pad &&
         p.y > box.y - pad && p.y < box.y + box.h + pad;
}

function boxEdgeDistance(p: Point, box: BoxRect): number {
  const nearX = Math.max(box.x, Math.min(box.x + box.w, p.x));
  const nearY = Math.max(box.y, Math.min(box.y + box.h, p.y));
  return Math.hypot(nearX - p.x, nearY - p.y);
}

function connectorLength(origin: Point, anchor: Point): number {
  return Math.hypot(anchor.x - origin.x, anchor.y - origin.y);
}

// --- Main evaluator ---

export function evaluateLayout(
  callouts: StoryCallout[],
  positioned: PositionedCallout[],
  projection: MapProjection,
  viewportParams: ViewportParams,
  renderedHeight = RENDERED_HEIGHT,
): EvalResult {
  const { visibleSvgHeight, bottomPaddingSvg } = viewportParams;

  // Project origins and reconstruct box rects
  const items = positioned.map((pc, i) => {
    const proj = projection([pc.country.longitude, pc.country.latitude]);
    if (!proj) throw new Error(`Cannot project ${callouts[i].country.name}`);
    const [sx, sy] = proj;
    const boxX = sx + pc.dx - BOX_WIDTH / 2;
    const boxY = sy + pc.dy - ANCHOR_Y;
    const anchorPt: Point = { x: sx + pc.dx, y: sy + pc.dy };
    const originPt: Point = { x: sx, y: sy };
    const box: BoxRect = { x: boxX, y: boxY, w: BOX_WIDTH, h: renderedHeight };
    return { callout: pc, box, anchorPt, originPt };
  });

  const violations: Violation[] = [];

  // Viewport bounds for box top-left corners
  const boundsMinX = EDGE_PADDING;
  const boundsMaxX = SVG_WIDTH - BOX_WIDTH - EDGE_PADDING;
  const boundsMinY = TOP_PADDING;
  const boundsMaxY = visibleSvgHeight - renderedHeight - bottomPaddingSvg;

  // Hard check 1: out-of-bounds
  for (const item of items) {
    const { box, callout } = item;
    const label = callout.country.name;
    if (box.x < boundsMinX || box.x > boundsMaxX || box.y < boundsMinY || box.y > boundsMaxY) {
      const detail = `box TL=(${box.x.toFixed(1)},${box.y.toFixed(1)}) bounds=[${boundsMinX},${boundsMaxX}]×[${boundsMinY.toFixed(1)},${boundsMaxY.toFixed(1)}]`;
      violations.push({ type: 'out-of-bounds', calloutA: label, detail });
    }
  }

  // Hard check 2: box-overlap (including min gap)
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (boxesOverlapWithGap(a.box, b.box, BOX_GAP_MIN)) {
        const gapX = Math.max(0, Math.max(a.box.x, b.box.x) - Math.min(a.box.x + a.box.w, b.box.x + b.box.w));
        const gapY = Math.max(0, Math.max(a.box.y, b.box.y) - Math.min(a.box.y + a.box.h, b.box.y + b.box.h));
        const actualGap = Math.min(gapX, gapY);
        violations.push({
          type: 'box-overlap',
          calloutA: a.callout.country.name,
          calloutB: b.callout.country.name,
          detail: `gap=${actualGap.toFixed(1)}px (min ${BOX_GAP_MIN}px)`,
          measured: actualGap,
          limit: BOX_GAP_MIN,
        });
      }
    }
  }

  // Hard check 3: connector-cross and connector-through-box
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];

      if (segmentsIntersect(a.originPt, a.anchorPt, b.originPt, b.anchorPt)) {
        violations.push({
          type: 'connector-cross',
          calloutA: a.callout.country.name,
          calloutB: b.callout.country.name,
          detail: 'connector lines cross',
        });
      }

      if (lineIntersectsBox(a.originPt, a.anchorPt, b.box)) {
        violations.push({
          type: 'connector-through-box',
          calloutA: a.callout.country.name,
          calloutB: b.callout.country.name,
          detail: `connector of ${a.callout.country.name} passes through box of ${b.callout.country.name}`,
        });
      }
      if (lineIntersectsBox(b.originPt, b.anchorPt, a.box)) {
        violations.push({
          type: 'connector-through-box',
          calloutA: b.callout.country.name,
          calloutB: a.callout.country.name,
          detail: `connector of ${b.callout.country.name} passes through box of ${a.callout.country.name}`,
        });
      }
    }
  }

  // Hard check 4: origin-obscured
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      if (pointInBox(items[j].originPt, items[i].box)) {
        violations.push({
          type: 'origin-obscured',
          calloutA: items[i].callout.country.name,
          calloutB: items[j].callout.country.name,
          detail: `origin of ${items[j].callout.country.name} is inside box of ${items[i].callout.country.name}`,
        });
      }
    }
  }

  // --- Soft metrics ---
  const lengths = items.map(item => connectorLength(item.originPt, item.anchorPt));
  const totalConnectorLength = lengths.reduce((s, l) => s + l, 0);
  const maxConnectorLength = Math.max(...lengths);

  let minOriginClearance = Infinity;
  for (const item of items) {
    for (const other of items) {
      const d = boxEdgeDistance(other.originPt, item.box);
      if (d < minOriginClearance) minOriginClearance = d;
    }
  }

  let minBoxBoxGap = Infinity;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i].box;
      const b = items[j].box;
      const gapX = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
      const gapY = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
      const gap = Math.min(gapX, gapY);
      if (gap < minBoxBoxGap) minBoxBoxGap = gap;
    }
  }

  let angularSpread = Infinity;
  if (items.length >= 2) {
    const angles = items.map(item => Math.atan2(item.anchorPt.y - item.originPt.y, item.anchorPt.x - item.originPt.x));
    for (let i = 0; i < angles.length; i++) {
      for (let j = i + 1; j < angles.length; j++) {
        const diff = Math.abs(angles[i] - angles[j]);
        const minDiff = Math.min(diff % (2 * Math.PI), (2 * Math.PI) - (diff % (2 * Math.PI)));
        if (minDiff < angularSpread) angularSpread = minDiff;
      }
    }
  }

  const originsOffscreen = items.filter(item =>
    item.originPt.x < 0 || item.originPt.x > SVG_WIDTH ||
    item.originPt.y < 0 || item.originPt.y > visibleSvgHeight
  ).length;

  const NEAR_MISS_THRESHOLD = 5;
  let nearMissCount = 0;
  for (let i = 0; i < items.length; i++) {
    const box = items[i].box;
    const marginX = Math.min(box.x - boundsMinX, boundsMaxX - box.x);
    const marginY = Math.min(box.y - boundsMinY, boundsMaxY - box.y);
    if (marginX >= 0 && marginX < NEAR_MISS_THRESHOLD) nearMissCount++;
    if (marginY >= 0 && marginY < NEAR_MISS_THRESHOLD) nearMissCount++;
  }

  const metrics: EvalMetrics = {
    totalConnectorLength,
    maxConnectorLength,
    minOriginClearance: minOriginClearance === Infinity ? 0 : minOriginClearance,
    minBoxBoxGap: minBoxBoxGap === Infinity ? 0 : minBoxBoxGap,
    angularSpread: angularSpread === Infinity ? 0 : angularSpread,
    originsOffscreen,
    nearMissCount,
  };

  return { pass: violations.length === 0, violations, metrics };
}

import { ConsensusGroup } from './consensus';
import type { MapProjection } from '../types/news';

export const CHIP_WIDTH = 60;
export const CHIP_HEIGHT = 24;
const CHIP_DISTANCES = [45, 65, 90, 130, 180, 240];
const CHIP_DIRECTIONS = 16;

const FULL_BOX_WIDTH = 135;
const FULL_BOX_HEIGHT = 140;

const EDGE_PADDING = 4;
const SVG_WIDTH = 800;
const TOP_PADDING = 4;

// Padding around a connector line when testing chip placement
const CONNECTOR_PAD = 5;

export interface PositionedChip {
  group: ConsensusGroup;
  x: number;
  y: number;
  originX: number;
  originY: number;
}

// A full-size callout connector: quadratic bezier from box anchor (x0,y0) to country origin (x1,y1),
// with control point at the midpoint ((x0+x1)/2, (y0+y1)/2) — matching StoryCalloutList path.
export interface Connector {
  x0: number; y0: number;
  x1: number; y1: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  const pad = 2;
  return a.x < b.x + b.w + pad &&
         a.x + a.w + pad > b.x &&
         a.y < b.y + b.h + pad &&
         a.y + a.h + pad > b.y;
}

// Segment-segment intersection test (2D).
function segSegIntersect(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number): boolean {
  const dABx = bx - ax, dABy = by - ay;
  const dCDx = dx - cx, dCDy = dy - cy;
  const denom = dABx * dCDy - dABy * dCDx;
  if (Math.abs(denom) < 1e-10) return false;
  const t = ((cx - ax) * dCDy - (cy - ay) * dCDx) / denom;
  const u = ((cx - ax) * dABy - (cy - ay) * dABx) / denom;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

// Axis-aligned rect edge intersection test with a line segment.
function segmentIntersectsRect(x1: number, y1: number, x2: number, y2: number, r: Rect, pad: number): boolean {
  const rx = r.x - pad, ry = r.y - pad, rx2 = r.x + r.w + pad, ry2 = r.y + r.h + pad;
  if (x1 >= rx && x1 <= rx2 && y1 >= ry && y1 <= ry2) return true;
  if (x2 >= rx && x2 <= rx2 && y2 >= ry && y2 <= ry2) return true;
  return segSegIntersect(x1, y1, x2, y2, rx, ry, rx, ry2) ||
         segSegIntersect(x1, y1, x2, y2, rx2, ry, rx2, ry2) ||
         segSegIntersect(x1, y1, x2, y2, rx, ry, rx2, ry) ||
         segSegIntersect(x1, y1, x2, y2, rx, ry2, rx2, ry2);
}

// Evaluate quadratic bezier at t.
function bezierPt(t: number, p0: number, cp: number, p1: number): number {
  const mt = 1 - t;
  return mt * mt * p0 + 2 * mt * t * cp + t * t * p1;
}

// Approximate bezier with 8 segments and test each against the chip rect.
function connectorIntersectsRect(conn: Connector, r: Rect): boolean {
  const cpx = (conn.x0 + conn.x1) / 2, cpy = (conn.y0 + conn.y1) / 2;
  const N = 8;
  let px = conn.x0, py = conn.y0;
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    const nx = bezierPt(t, conn.x0, cpx, conn.x1);
    const ny = bezierPt(t, conn.y0, cpy, conn.y1);
    if (segmentIntersectsRect(px, py, nx, ny, r, CONNECTOR_PAD)) return true;
    px = nx; py = ny;
  }
  return false;
}

const ORIGIN_PAD = 4; // min clearance around another chip's origin dot

function tryPlace(
  groups: ConsensusGroup[],
  projection: MapProjection,
  fullSizeBoxes: Array<{ x: number; y: number }>,
  connectors: Connector[],
  svgWidth: number,
  svgHeight: number,
): PositionedChip[] | null {
  // Pre-compute all chip origins so we can avoid obscuring them.
  const allOrigins: Array<{ iso2: string; x: number; y: number }> = groups.flatMap(g => {
    const pt = projection([g.country.longitude, g.country.latitude]);
    return pt ? [{ iso2: g.country.iso2, x: pt[0], y: pt[1] }] : [];
  });

  const placed: PositionedChip[] = [];
  const chipRect = (x: number, y: number): Rect => ({ x, y, w: CHIP_WIDTH, h: CHIP_HEIGHT });
  const fullRect = (bx: number, by: number): Rect => ({ x: bx, y: by, w: FULL_BOX_WIDTH, h: FULL_BOX_HEIGHT });

  const clearOfConnectors = (cr: Rect): boolean => {
    return connectors.every(conn => !connectorIntersectsRect(conn, cr));
  };

  const clearOfOtherOrigins = (cr: Rect, ownIso2: string): boolean => {
    for (const origin of allOrigins) {
      if (origin.iso2 === ownIso2) continue;
      if (origin.x >= cr.x - ORIGIN_PAD && origin.x <= cr.x + cr.w + ORIGIN_PAD &&
          origin.y >= cr.y - ORIGIN_PAD && origin.y <= cr.y + cr.h + ORIGIN_PAD) return false;
    }
    return true;
  };

  for (const group of groups) {
    const projected = projection([group.country.longitude, group.country.latitude]);
    if (!projected) continue;
    const [ox, oy] = projected;

    const candidates: Array<{ x: number; y: number; dist: number }> = [];
    for (let dir = 0; dir < CHIP_DIRECTIONS; dir++) {
      const angle = -Math.PI + (dir * 2 * Math.PI) / CHIP_DIRECTIONS;
      for (const dist of CHIP_DISTANCES) {
        const cx = ox + Math.cos(angle) * dist - CHIP_WIDTH / 2;
        const cy = oy + Math.sin(angle) * dist - CHIP_HEIGHT / 2;
        if (cx < EDGE_PADDING || cx + CHIP_WIDTH > svgWidth - EDGE_PADDING) continue;
        if (cy < TOP_PADDING || cy + CHIP_HEIGHT > svgHeight - EDGE_PADDING) continue;
        candidates.push({ x: cx, y: cy, dist });
      }
    }

    candidates.sort((a, b) => a.dist - b.dist);

    let chosen = candidates.find(c => {
      const cr = chipRect(c.x, c.y);
      for (const p of placed) {
        if (rectsOverlap(cr, chipRect(p.x, p.y))) return false;
      }
      for (const fb of fullSizeBoxes) {
        const pad = 4;
        const fr = fullRect(fb.x, fb.y);
        if (rectsOverlap(
          { x: cr.x - pad, y: cr.y - pad, w: cr.w + pad * 2, h: cr.h + pad * 2 },
          fr
        )) return false;
      }
      if (!clearOfConnectors(cr)) return false;
      if (!clearOfOtherOrigins(cr, group.country.iso2)) return false;
      return true;
    });

    if (!chosen) {
      const fbPad = 4;
      const fallbackCandidates: Array<{ x: number; y: number; dist: number }> = [];
      for (const dy of [-1, 1]) {
        for (let extra = 0; extra <= 40; extra += 20) {
          fallbackCandidates.push({ x: ox - CHIP_WIDTH / 2, y: oy + dy * (CHIP_HEIGHT + 6 + extra), dist: 999 });
        }
      }
      for (const dx of [-1, 1]) {
        for (let extra = 0; extra <= 40; extra += 20) {
          fallbackCandidates.push({ x: ox + dx * (CHIP_WIDTH + 8 + extra), y: oy - CHIP_HEIGHT / 2, dist: 999 });
        }
      }
      for (const dy of [-1, 1]) {
        for (const dx of [-1, 1]) {
          for (let extra = 0; extra <= 40; extra += 20) {
            fallbackCandidates.push({ x: ox + dx * (CHIP_WIDTH + 8 + extra), y: oy + dy * (CHIP_HEIGHT + 6 + extra), dist: 999 });
          }
        }
      }
      chosen = fallbackCandidates.find(f => {
        if (f.x < EDGE_PADDING || f.x + CHIP_WIDTH > svgWidth - EDGE_PADDING) return false;
        if (f.y < TOP_PADDING || f.y + CHIP_HEIGHT > svgHeight - EDGE_PADDING) return false;
        const cr = chipRect(f.x, f.y);
        for (const p of placed) {
          if (rectsOverlap(cr, chipRect(p.x, p.y))) return false;
        }
        for (const fb of fullSizeBoxes) {
          const fr = fullRect(fb.x, fb.y);
          if (rectsOverlap(
            { x: cr.x - fbPad, y: cr.y - fbPad, w: cr.w + fbPad * 2, h: cr.h + fbPad * 2 },
            fr
          )) return false;
        }
        if (!clearOfConnectors(cr)) return false;
        if (!clearOfOtherOrigins(cr, group.country.iso2)) return false;
        return true;
      }) ?? { x: ox - CHIP_WIDTH / 2, y: oy - CHIP_HEIGHT / 2, dist: 0 };
    }

    if (!chosen) return null;
    placed.push({ group, x: chosen.x, y: chosen.y, originX: ox, originY: oy });
  }

  return placed;
}

export function placeChips(
  chipGroups: ConsensusGroup[],
  projection: MapProjection,
  fullSizeBoxes: Array<{ x: number; y: number }>,
  connectors: Connector[] = [],
  svgWidth: number = SVG_WIDTH,
  svgHeight: number = 600
): PositionedChip[] {
  const sorted = [...chipGroups].sort((a, b) => a.country.iso2.localeCompare(b.country.iso2));
  return tryPlace(sorted, projection, fullSizeBoxes, connectors, svgWidth, svgHeight) ?? [];
}

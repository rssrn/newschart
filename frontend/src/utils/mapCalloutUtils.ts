// Exhaustive candidate enumeration layout for map callout positioning.
//
// Previously tried algorithms (all removed in favour of exhaustive):
//   - force:      D3.js force simulation with collision detection, cluster layout, and
//                 custom forces for bounds/south-avoidance/short-lines. Produced decent
//                 results but non-deterministic and hard to tune.
//   - rails:      Placed callouts along left/right edges based on hemisphere (west→left,
//                 east→right), sorted by latitude. Simple but connectors were very long.
//   - compass:    Greedy placement trying 8 compass directions per callout, rotating
//                 clockwise from a preferred direction based on y-rank and hemisphere.
//                 Good results but greedy ordering caused suboptimal layouts.
//   - four-winds: Assigned the 4 most extreme points to diagonal directions (NW/NE/SW/SE).
//                 Only supported exactly 4 callouts and was too rigid.
//
// The exhaustive algorithm generates up to 96 candidate positions per callout (16 directions
// × 6 distances, filtered by bounds/origin-obscuring), then evaluates every combination
// and picks the lowest-penalty layout. With N≤4 labels this is trivially fast (<1ms).
//
// @author Claude Opus 4.6 Anthropic
// @author Claude Sonnet 4.5 Anthropic (TypeScript migration)

import { StoryCallout, PositionedCallout, LayoutNode, LayoutCandidate, MapProjection, LayoutDiagnostics, CandidateDiag, NodeDiagnostics, ScoreBreakdown } from '../types/news';

export const BOX_WIDTH = 135;
export const ANCHOR_Y = 50;
// Actual top edge of the foreignObject relative to the translate point (foreignObject y=-70).
// ANCHOR_Y is 50px below the visual top, leaving 20px of box above the connector anchor.
export const BOX_VISUAL_TOP = 70;
const EDGE_PADDING = 40;

interface Point {
  x: number;
  y: number;
}

/**
 * calculateOffsets delegates to calculateOffsetsWithDiagnostics and drops the diagnostics.
 * All existing call sites continue to use this function unchanged.
 *
 * obstaclePoints: additional SVG-space points (e.g. single-story country markers in consensus
 * view) that callout boxes must not cover, even though they have no associated callout.
 *
 * @author Claude Sonnet 4.6 Anthropic
 */
export function calculateOffsets(
  callouts: StoryCallout[],
  projection: MapProjection,
  visibleSvgHeight: number = 600,
  bottomPadding: number = 0,
  obstaclePoints: { x: number; y: number }[] = [],
  viewportWidth: number = 800
): PositionedCallout[] {
  return calculateOffsetsWithDiagnostics(callouts, projection, visibleSvgHeight, bottomPadding, obstaclePoints, viewportWidth).positioned;
}

/**
 * Exhaustive candidate enumeration layout with full diagnostics output.
 * Records per-node candidate lists, the chosen candidate, and winning combination
 * score breakdown. No behaviour difference from calculateOffsets.
 *
 * @author Claude Sonnet 4.6 Anthropic
 */
export function calculateOffsetsWithDiagnostics(
  callouts: StoryCallout[],
  projection: MapProjection,
  visibleSvgHeight: number = 600,
  bottomPadding: number = 0,
  obstaclePoints: { x: number; y: number }[] = [],
  viewportWidth: number = 800
): { positioned: PositionedCallout[]; diagnostics: LayoutDiagnostics } {
  const empty = (): { positioned: PositionedCallout[]; diagnostics: LayoutDiagnostics } => ({
    positioned: [],
    diagnostics: { nodes: [], bestScore: 0, combinationsEvaluated: 0 },
  });
  if (!Array.isArray(callouts) || !projection) return empty();
  if (callouts.length === 0) return empty();

  const _inner = _calculateOffsets(callouts, projection, visibleSvgHeight, bottomPadding, obstaclePoints, viewportWidth);
  return _inner;
}

// @author Claude Sonnet 4.6 Anthropic
function _calculateOffsets(
  callouts: StoryCallout[],
  projection: MapProjection,
  visibleSvgHeight: number,
  bottomPadding: number,
  obstaclePoints: Point[] = [],
  viewportWidth: number = 800
): { positioned: PositionedCallout[]; diagnostics: LayoutDiagnostics } {

  // --- Coordinate setup ---
  // Use SVG viewport bounds (800 wide)
  const SVG_WIDTH = 800;

  // Convert callouts to screen coordinates
  const nodes: LayoutNode[] = callouts.map((callout) => {
    const projected = projection([callout.country.longitude, callout.country.latitude]);
    // d3 projection can return null if point is not projectable
    if (!projected) {
      throw new Error(`Could not project coordinates for ${callout.country.name}`);
    }
    const [x, y] = projected;
    return { ...callout, subjectX: x, subjectY: y };
  });

  // The foreignObject is BOX_WIDTH x BOX_HEIGHT (135x100) but has overflow:visible,
  // so the rendered box is taller than declared. Use RENDERED_HEIGHT for collision
  // detection, and ANCHOR_Y for the annotation point offset from box top.
  const RENDERED_HEIGHT = 140; // measured: 133-144 SVG units (varies with text length)
  // ANCHOR_Y is declared at module level (see above) — used here for box positioning

  // --- Geometry helpers ---

  function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(denom) < 0.001) return false;
    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom;
    return t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99;
  }

  function lineIntersectsBox(p1: Point, p2: Point, box: Point): boolean {
    const pad = 5;
    const bx = box.x - pad;
    const by = box.y - pad;
    const bw = BOX_WIDTH + pad * 2;
    const bh = RENDERED_HEIGHT + pad * 2;
    return segmentsIntersect(p1, p2, { x: bx, y: by }, { x: bx + bw, y: by }) ||
           segmentsIntersect(p1, p2, { x: bx + bw, y: by }, { x: bx + bw, y: by + bh }) ||
           segmentsIntersect(p1, p2, { x: bx + bw, y: by + bh }, { x: bx, y: by + bh }) ||
           segmentsIntersect(p1, p2, { x: bx, y: by + bh }, { x: bx, y: by });
  }

  function boxesOverlap(ax: number, ay: number, bx: number, by: number): boolean {
    const pad = 10; // minimum spacing between boxes
    return ax < bx + BOX_WIDTH + pad &&
           ax + BOX_WIDTH + pad > bx &&
           ay < by + RENDERED_HEIGHT + pad &&
           ay + RENDERED_HEIGHT + pad > by;
  }

  // Minimum distance from point p to line segment [a, b].
  // @author Claude Sonnet 4.6 Anthropic
  function distancePointToSegment(p: Point, a: Point, b: Point): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  // --- Step 1: Viewport bounds for candidate filtering ---
  const TOP_PADDING = 20; // smaller than EDGE_PADDING: top of map is open ocean, less risk of clipping
  const boundsMinX = EDGE_PADDING;
  const boundsMaxX = SVG_WIDTH - BOX_WIDTH - EDGE_PADDING;
  const boundsMinY = TOP_PADDING;
  const boundsMaxY = visibleSvgHeight - RENDERED_HEIGHT - bottomPadding;

  // Top-right exclusion zone: the controls panel (VIEW/HIGHLIGHT/MAP radio buttons) sits at
  // top-right in HTML space. Convert its approximate pixel footprint to SVG units so callouts
  // can't be placed underneath it. Apply only on full desktop (≥1024px) where the panel is
  // wide enough in SVG-coordinate space to cause real overlap. Below that the standard bounds
  // already constrain placement enough without aggressively cutting off right-side candidates.
  // Pixel estimates: panel ~210px from right edge (width + 12px margin), ~370px tall.
  const svgScale = SVG_WIDTH / viewportWidth;
  const topRightExclXMin = viewportWidth >= 1024 ? SVG_WIDTH - 210 * svgScale : SVG_WIDTH;
  const topRightExclYMax = viewportWidth >= 1024 ? 370 * svgScale : 0;

  // --- Step 2: Generate candidate positions per callout ---
  // 16-way grid (22.5° steps): the extra intermediate angles let a connector thread
  // *between* two neighbouring boxes instead of being forced through one of them —
  // important for clustered origins (e.g. Middle East + East Asia stories).
  // @author Claude Opus 4.7 Anthropic
  const DIRECTIONS: { angle: number }[] = Array.from({ length: 16 }, (_, i) => ({
    angle: -Math.PI + (i * Math.PI) / 8,
  }));
  const DISTANCES: number[] = [95, 110, 145, 185, 225, 270];
  const ORIGIN_PADDING = 10;

  // Helper: check if a box position would obscure another callout's origin point.
  // Skips the callout's own origin — its box is expected to be near its own subject point.
  // Obstacle points (single-story markers) are NOT hard-rejected here — they're small dots
  // and a hard reject at candidate generation is too aggressive on busy news days with many
  // highlighted countries. Their avoidance is handled as a soft penalty in scoreOriginProximity.
  // @author Claude Opus 4.6 Anthropic
  function boxObscuresOrigin(boxX: number, boxY: number, selfIndex: number): boolean {
    for (let k = 0; k < nodes.length; k++) {
      if (k === selfIndex) continue;
      const n = nodes[k];
      if (boxX - ORIGIN_PADDING < n.subjectX && n.subjectX < boxX + BOX_WIDTH + ORIGIN_PADDING &&
          boxY - ORIGIN_PADDING < n.subjectY && n.subjectY < boxY + RENDERED_HEIGHT + ORIGIN_PADDING) {
        return true;
      }
    }
    return false;
  }

  // Helper: check if a box position is within viewport bounds
  function isWithinBounds(boxX: number, boxY: number): boolean {
    if (boxX < boundsMinX || boxX > boundsMaxX || boxY < boundsMinY || boxY > boundsMaxY) return false;
    // Reject boxes whose right edge overlaps the controls panel area at the top of the viewport
    if (boxY < topRightExclYMax && boxX + BOX_WIDTH > topRightExclXMin) return false;
    return true;
  }

  // allCandidatesPerNode includes rejected candidates with rejectedReason set (for diagnostics).
  // candidatesPerNode contains only accepted candidates used for enumeration.
  const allCandidatesPerNode: CandidateDiag[][] = [];
  const candidatesPerNode: LayoutCandidate[][] = nodes.map((node, nodeIndex) => {
    const accepted: LayoutCandidate[] = [];
    const all: CandidateDiag[] = [];
    for (const dir of DIRECTIONS) {
      for (const dist of DISTANCES) {
        const boxX = node.subjectX + Math.cos(dir.angle) * dist - BOX_WIDTH / 2;
        const boxY = node.subjectY + Math.sin(dir.angle) * dist - ANCHOR_Y;

        if (!isWithinBounds(boxX, boxY)) {
          all.push({ boxX, boxY, dist, angle: dir.angle, rejectedReason: 'out-of-bounds' });
          continue;
        }
        if (boxObscuresOrigin(boxX, boxY, nodeIndex)) {
          all.push({ boxX, boxY, dist, angle: dir.angle, rejectedReason: 'obscures-origin' });
          continue;
        }
        all.push({ boxX, boxY, dist, angle: dir.angle });
        accepted.push({ boxX, boxY, dist, angle: dir.angle });
      }
    }
    allCandidatesPerNode.push(all);
    return accepted;
  });

  // --- Step 3: Enumerate all combinations and score ---

  // Helper: calculate penalty for interaction between two placements
  function scorePairInteraction(
    i: number, j: number,
    pi: LayoutCandidate, pj: LayoutCandidate,
    ni: LayoutNode, nj: LayoutNode
  ): number {
    const ci: Point = { x: pi.boxX + BOX_WIDTH / 2, y: pi.boxY + ANCHOR_Y };
    const cj: Point = { x: pj.boxX + BOX_WIDTH / 2, y: pj.boxY + ANCHOR_Y };

    // Hard reject: box overlap
    if (boxesOverlap(pi.boxX, pi.boxY, pj.boxX, pj.boxY)) {
      return Infinity;
    }

    let penalty = 0;

    // Penalty: vertical clustering (prefer vertical spread so layout isn't flat)
    const ci_centerY = pi.boxY + RENDERED_HEIGHT / 2;
    const cj_centerY = pj.boxY + RENDERED_HEIGHT / 2;
    const verticalSep = Math.abs(ci_centerY - cj_centerY);
    if (verticalSep < 100) {
      penalty += (100 - verticalSep) * 0.5;
    }

    // Penalty: connector i crosses connector j
    if (segmentsIntersect({ x: ni.subjectX, y: ni.subjectY }, ci,
                          { x: nj.subjectX, y: nj.subjectY }, cj)) {
      penalty += 600;
    }

    // Penalty: connector i passes through box j.
    // Weighted above a connector crossing (600): a leader line ploughing through a
    // callout box reads worse than two lines merely crossing. @author Claude Opus 4.7 Anthropic
    if (lineIntersectsBox({ x: ni.subjectX, y: ni.subjectY }, ci,
                          { x: pj.boxX, y: pj.boxY })) {
      penalty += 700;
    }
    // Penalty: connector j passes through box i
    if (lineIntersectsBox({ x: nj.subjectX, y: nj.subjectY }, cj,
                          { x: pi.boxX, y: pi.boxY })) {
      penalty += 700;
    }

    // Penalty: similar connector directions (prefer angular spread between callouts).
    // Penalises pairs whose angles are within 90° of each other — tapers from 120 at 0° to 0 at 90°.
    // NW+SW = 90° apart → 0 penalty; W+W = 0° apart → 120 penalty.
    const rawDiff = Math.abs(pi.angle - pj.angle);
    const angleDiff = Math.min(rawDiff % (2 * Math.PI), (2 * Math.PI) - (rawDiff % (2 * Math.PI)));
    if (angleDiff < Math.PI / 2) {
      penalty += (1 - angleDiff / (Math.PI / 2)) * 120;
    }

    return penalty;
  }

  // Helper: calculate penalty for origin points near a placement.
  // selfIndex is excluded — a box sitting near its own origin is expected and fine,
  // matching the same exclusion in boxObscuresOrigin. Obstacle points (e.g. single-story
  // country markers in consensus view) are always included with no self-exclusion.
  // @author Claude Sonnet 4.6 Anthropic
  function scoreOriginProximity(pi: LayoutCandidate, selfIndex: number): number {
    for (let k = 0; k < nodes.length; k++) {
      if (k === selfIndex) continue;
      const nk = nodes[k];
      // Hard reject: another callout's origin literally inside this box
      if (nk.subjectX > pi.boxX && nk.subjectX < pi.boxX + BOX_WIDTH &&
          nk.subjectY > pi.boxY && nk.subjectY < pi.boxY + RENDERED_HEIGHT) {
        return Infinity;
      }
    }
    // Obstacle points (small country dots): hard-reject only if literally inside the box,
    // not at the edge — they're smaller markers so the threshold stays tight.
    for (const pt of obstaclePoints) {
      if (pt.x > pi.boxX && pt.x < pi.boxX + BOX_WIDTH &&
          pt.y > pi.boxY && pt.y < pi.boxY + RENDERED_HEIGHT) {
        return Infinity;
      }
    }

    let penalty = 0;
    for (let k = 0; k < nodes.length; k++) {
      if (k === selfIndex) continue;
      const nk = nodes[k];
      // Graduated penalty: another origin near the box edge
      const nearestX = Math.max(pi.boxX, Math.min(pi.boxX + BOX_WIDTH, nk.subjectX));
      const nearestY = Math.max(pi.boxY, Math.min(pi.boxY + RENDERED_HEIGHT, nk.subjectY));
      const edgeDist = Math.hypot(nearestX - nk.subjectX, nearestY - nk.subjectY);
      if (edgeDist < 70) {
        penalty += (70 - edgeDist) * 10;
      }
    }
    // Obstacle points get a softer gradient: narrower radius, lower multiplier.
    // Using the same weight as callout origins on busy news days would push all callouts
    // into a cluster by eliminating too many candidate directions. @author Claude Sonnet 4.6 Anthropic
    for (const pt of obstaclePoints) {
      const nearestX = Math.max(pi.boxX, Math.min(pi.boxX + BOX_WIDTH, pt.x));
      const nearestY = Math.max(pi.boxY, Math.min(pi.boxY + RENDERED_HEIGHT, pt.y));
      const edgeDist = Math.hypot(nearestX - pt.x, nearestY - pt.y);
      if (edgeDist < 35) {
        penalty += (35 - edgeDist) * 4;
      }
    }
    return penalty;
  }

  // Score a full combination of placements
  function scoreCombination(placements: LayoutCandidate[]): number {
    let score = 0;
    const n = placements.length;

    // Check all pairs
    for (let i = 0; i < n; i++) {
      const pi = placements[i];
      const ni = nodes[i];

      for (let j = i + 1; j < n; j++) {
        const pairPenalty = scorePairInteraction(i, j, pi, placements[j], ni, nodes[j]);
        if (pairPenalty === Infinity) {
          return Infinity;
        }
        score += pairPenalty;
      }

      // Penalty: connector length (prefer short connectors)
      score += pi.dist;

      // Penalty: cardinal directions (bias towards diagonals for visual variety)
      // sin(2θ) is 0 at cardinals (0, π/2, π, 3π/2) and ±1 at diagonals
      const diagonalBias = 1 - Math.abs(Math.sin(2 * pi.angle));
      score += diagonalBias * 60;

      // Penalty: origin point proximity to this box
      const proximityPenalty = scoreOriginProximity(pi, i);
      if (proximityPenalty === Infinity) {
        return Infinity;
      }
      score += proximityPenalty;

      // Penalty: connector passes close to an obstacle point (e.g. a single-story country
      // marker in consensus view). Soft graduated penalty only — no hard reject, since on
      // busy news days there are many obstacle points and a hard reject would eliminate too
      // many candidate directions. @author Claude Sonnet 4.6 Anthropic
      if (obstaclePoints.length > 0) {
        const connStart = { x: ni.subjectX, y: ni.subjectY };
        const connEnd   = { x: pi.boxX + BOX_WIDTH / 2, y: pi.boxY + ANCHOR_Y };
        for (const pt of obstaclePoints) {
          const d = distancePointToSegment(pt, connStart, connEnd);
          if (d < 15) score += (15 - d) * 8;
        }
      }
    }

    return score;
  }

  // Recursive enumeration of cartesian product of candidates
  let bestScore: number = Infinity;
  let bestPlacements: LayoutCandidate[] | null = null;
  let combinationsEvaluated = 0;

  function enumerate(nodeIndex: number, currentPlacements: LayoutCandidate[]): void {
    if (nodeIndex === nodes.length) {
      combinationsEvaluated++;
      const score = scoreCombination(currentPlacements);
      if (score < bestScore) {
        bestScore = score;
        bestPlacements = [...currentPlacements];
      }
      return;
    }

    const candidates = candidatesPerNode[nodeIndex];
    for (const candidate of candidates) {
      // Early prune: check overlap with already-placed boxes before recursing
      let overlaps = false;
      for (const placement of currentPlacements) {
        if (boxesOverlap(candidate.boxX, candidate.boxY,
                         placement.boxX, placement.boxY)) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      currentPlacements.push(candidate);
      enumerate(nodeIndex + 1, currentPlacements);
      currentPlacements.pop();
    }
  }

  enumerate(0, []);

  // --- Step 4: Convert to dx/dy offsets ---
  if (!bestPlacements) {
    console.warn(`[exhaustive] No valid combination found (${nodes.length} nodes, candidates per node: ${candidatesPerNode.map(c => c.length).join(',')}). Using zero offsets.`);
    const fallback = callouts.map((original) => ({ ...original, dx: 0, dy: -80 }));
    return {
      positioned: fallback,
      diagnostics: { nodes: [], bestScore: Infinity, combinationsEvaluated },
    };
  }

  // TypeScript needs this reassignment to understand bestPlacements is non-null here
  const finalPlacements: LayoutCandidate[] = bestPlacements;
  if (!import.meta.env.VITEST) {
    console.log(`[exhaustive] Best score: ${bestScore}, candidates per node: ${candidatesPerNode.map(c => c.length).join(',')}, svgH=${visibleSvgHeight}`);
  }

  // Build per-node diagnostics for the winning combination
  const nodeDiagnostics: NodeDiagnostics[] = finalPlacements.map((chosen, i) => {
    const ni = nodes[i];
    const ci: Point = { x: chosen.boxX + BOX_WIDTH / 2, y: chosen.boxY + ANCHOR_Y };

    const diagonalBias = 1 - Math.abs(Math.sin(2 * chosen.angle));
    const proximityPenalty = scoreOriginProximity(chosen, i);

    let crossing = 0;
    let throughBox = 0;
    let angularSpread = 0;
    let verticalClustering = 0;

    for (let j = 0; j < finalPlacements.length; j++) {
      if (j === i) continue;
      const pj = finalPlacements[j];
      const nj = nodes[j];
      const cj: Point = { x: pj.boxX + BOX_WIDTH / 2, y: pj.boxY + ANCHOR_Y };

      if (segmentsIntersect({ x: ni.subjectX, y: ni.subjectY }, ci,
                            { x: nj.subjectX, y: nj.subjectY }, cj)) {
        crossing += 300; // half of the 600 pair penalty attributed to each side
      }
      if (lineIntersectsBox({ x: ni.subjectX, y: ni.subjectY }, ci, { x: pj.boxX, y: pj.boxY })) {
        throughBox += 700;
      }
      const rawDiff = Math.abs(chosen.angle - pj.angle);
      const angleDiff = Math.min(rawDiff % (2 * Math.PI), (2 * Math.PI) - (rawDiff % (2 * Math.PI)));
      if (angleDiff < Math.PI / 2) {
        angularSpread += (1 - angleDiff / (Math.PI / 2)) * 60; // half of the 120 pair penalty
      }
      const ciCenterY = chosen.boxY + RENDERED_HEIGHT / 2;
      const cjCenterY = pj.boxY + RENDERED_HEIGHT / 2;
      const vertSep = Math.abs(ciCenterY - cjCenterY);
      if (vertSep < 100) {
        verticalClustering += (100 - vertSep) * 0.25; // half of the 0.5 pair penalty
      }
    }

    const breakdown: ScoreBreakdown = {
      connectorLength: chosen.dist,
      crossing,
      throughBox,
      originProximity: proximityPenalty === Infinity ? 0 : proximityPenalty,
      angularSpread,
      diagonalBias: diagonalBias * 60,
      verticalClustering,
    };

    return {
      allCandidates: allCandidatesPerNode[i],
      chosenCandidate: chosen,
      scoreContribution: breakdown,
    };
  });

  const positioned = callouts.map((original, index) => {
    const p: LayoutCandidate = finalPlacements[index];
    return {
      ...original,
      dx: p.boxX + BOX_WIDTH / 2 - nodes[index].subjectX,
      dy: p.boxY + ANCHOR_Y - nodes[index].subjectY,
    };
  });

  return {
    positioned,
    diagnostics: { nodes: nodeDiagnostics, bestScore, combinationsEvaluated },
  };
}

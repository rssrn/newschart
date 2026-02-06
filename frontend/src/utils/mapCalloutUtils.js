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
// The exhaustive algorithm generates ~20-30 candidate positions per callout (8 directions
// × 5 distances, filtered by bounds/origin-obscuring), then evaluates every combination
// and picks the lowest-penalty layout. With N≤4 labels this is trivially fast (<1ms).
//
// @author Claude Opus 4.6 Anthropic

const BOX_WIDTH = 135;
const BOX_HEIGHT = 100;
const EDGE_PADDING = 40;

/**
 * Exhaustive candidate enumeration layout - generates candidate positions for each
 * callout, evaluates every combination, and picks the one with the lowest penalty score.
 *
 * Based on the Point-Feature Label Placement (PFLP) literature.
 *
 * @param {Array} callouts - Array of callout objects with country data
 * @param {Function} projection - Map projection function
 * @param {number} visibleSvgHeight - Visible SVG height in SVG coordinates (accounts for viewport clipping)
 */
export function calculateOffsets(callouts, projection, visibleSvgHeight = 600) {
  if (!Array.isArray(callouts) || !projection) return [];
  if (callouts.length === 0) return [];

  // --- Coordinate setup ---
  // Use SVG viewport bounds (react-simple-maps defaults: 800 wide)
  const SVG_WIDTH = 800;

  // Convert callouts to screen coordinates
  const nodes = callouts.map((callout) => {
    const [x, y] = projection([callout.country.longitude, callout.country.latitude]);
    return { ...callout, subjectX: x, subjectY: y };
  });

  // The foreignObject is BOX_WIDTH x BOX_HEIGHT (135x100) but has overflow:visible,
  // so the rendered box is taller than declared. Use RENDERED_HEIGHT for collision
  // detection, and ANCHOR_Y for the annotation point offset from box top.
  const RENDERED_HEIGHT = 150; // measured: 133-144 SVG units (varies with text length)
  const ANCHOR_Y = 50; // foreignObject y=-50: annotation point is 50px below box top

  // --- Geometry helpers ---

  function segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.001) return false;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    return t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99;
  }

  function lineIntersectsBox(x1, y1, x2, y2, box) {
    const pad = 5;
    const bx = box.x - pad;
    const by = box.y - pad;
    const bw = BOX_WIDTH + pad * 2;
    const bh = RENDERED_HEIGHT + pad * 2;
    return segmentsIntersect(x1, y1, x2, y2, bx, by, bx + bw, by) ||
           segmentsIntersect(x1, y1, x2, y2, bx + bw, by, bx + bw, by + bh) ||
           segmentsIntersect(x1, y1, x2, y2, bx + bw, by + bh, bx, by + bh) ||
           segmentsIntersect(x1, y1, x2, y2, bx, by + bh, bx, by);
  }

  function boxesOverlap(ax, ay, bx, by) {
    const pad = 10; // minimum spacing between boxes
    return ax < bx + BOX_WIDTH + pad &&
           ax + BOX_WIDTH + pad > bx &&
           ay < by + RENDERED_HEIGHT + pad &&
           ay + RENDERED_HEIGHT + pad > by;
  }

  // --- Step 1: Viewport bounds for candidate filtering ---
  const boundsMinX = EDGE_PADDING;
  const boundsMaxX = SVG_WIDTH - BOX_WIDTH - EDGE_PADDING;
  const boundsMinY = EDGE_PADDING;
  const boundsMaxY = visibleSvgHeight - RENDERED_HEIGHT - 15; // less bottom padding: nothing below the map

  // --- Step 2: Generate candidate positions per callout ---
  const DIRECTIONS = [
    { angle: -3 * Math.PI / 4 }, // NW
    { angle: -Math.PI / 2 },     // N
    { angle: -Math.PI / 4 },     // NE
    { angle: 0 },                // E
    { angle: Math.PI / 4 },      // SE
    { angle: Math.PI / 2 },      // S
    { angle: 3 * Math.PI / 4 },  // SW
    { angle: Math.PI },          // W
  ];
  const DISTANCES = [80, 110, 145, 185, 225];
  const ORIGIN_PADDING = 10;

  const candidatesPerNode = nodes.map((node) => {
    const candidates = [];
    for (const dir of DIRECTIONS) {
      for (const dist of DISTANCES) {
        // Box top-left: annotation point at (subjectX + cos*dist, subjectY + sin*dist),
        // box top is ANCHOR_Y above that point (matching foreignObject y=-50)
        const boxX = node.subjectX + Math.cos(dir.angle) * dist - BOX_WIDTH / 2;
        const boxY = node.subjectY + Math.sin(dir.angle) * dist - ANCHOR_Y;

        // Hard reject: any part of box outside map bounds
        if (boxX < boundsMinX || boxX > boundsMaxX ||
            boxY < boundsMinY || boxY > boundsMaxY) {
          continue;
        }

        // Hard reject: box would obscure any origin point
        let obscuresOrigin = false;
        for (const n of nodes) {
          if (boxX - ORIGIN_PADDING < n.subjectX && n.subjectX < boxX + BOX_WIDTH + ORIGIN_PADDING &&
              boxY - ORIGIN_PADDING < n.subjectY && n.subjectY < boxY + RENDERED_HEIGHT + ORIGIN_PADDING) {
            obscuresOrigin = true;
            break;
          }
        }
        if (obscuresOrigin) continue;

        candidates.push({ boxX, boxY, dist });
      }
    }
    return candidates;
  });

  // --- Step 3: Enumerate all combinations and score ---

  // Score a full combination of placements
  function scoreCombination(placements) {
    let score = 0;
    const n = placements.length;

    // Check all pairs
    for (let i = 0; i < n; i++) {
      const pi = placements[i];
      const ni = nodes[i];
      // Connector from subject point to annotation point (ANCHOR_Y below box top)
      const ciX = pi.boxX + BOX_WIDTH / 2;
      const ciY = pi.boxY + ANCHOR_Y;

      for (let j = i + 1; j < n; j++) {
        const pj = placements[j];
        const nj = nodes[j];
        const cjX = pj.boxX + BOX_WIDTH / 2;
        const cjY = pj.boxY + ANCHOR_Y;

        // Hard reject: box overlap
        if (boxesOverlap(pi.boxX, pi.boxY, pj.boxX, pj.boxY)) {
          return Infinity;
        }

        // Penalty: connector i crosses connector j
        if (segmentsIntersect(ni.subjectX, ni.subjectY, ciX, ciY,
                              nj.subjectX, nj.subjectY, cjX, cjY)) {
          score += 100;
        }

        // Penalty: connector i passes through box j
        if (lineIntersectsBox(ni.subjectX, ni.subjectY, ciX, ciY,
                              { x: pj.boxX, y: pj.boxY })) {
          score += 80;
        }
        // Penalty: connector j passes through box i
        if (lineIntersectsBox(nj.subjectX, nj.subjectY, cjX, cjY,
                              { x: pi.boxX, y: pi.boxY })) {
          score += 80;
        }
      }

      // Penalty: connector length (prefer short connectors)
      score += pi.dist * 1.0;

      // Penalty: origin point proximity to this box
      for (let k = 0; k < n; k++) {
        const nk = nodes[k];
        // Hard reject: origin literally inside the box
        if (nk.subjectX > pi.boxX && nk.subjectX < pi.boxX + BOX_WIDTH &&
            nk.subjectY > pi.boxY && nk.subjectY < pi.boxY + RENDERED_HEIGHT) {
          return Infinity;
        }
        // Graduated penalty: origin near the box edge
        const nearestX = Math.max(pi.boxX, Math.min(pi.boxX + BOX_WIDTH, nk.subjectX));
        const nearestY = Math.max(pi.boxY, Math.min(pi.boxY + RENDERED_HEIGHT, nk.subjectY));
        const edgeDist = Math.sqrt((nearestX - nk.subjectX) ** 2 + (nearestY - nk.subjectY) ** 2);
        if (edgeDist < 70) {
          score += (70 - edgeDist) * 10;
        }
      }
    }

    return score;
  }

  // Recursive enumeration of cartesian product of candidates
  let bestScore = Infinity;
  let bestPlacements = null;

  function enumerate(nodeIndex, currentPlacements) {
    if (nodeIndex === nodes.length) {
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
      for (let i = 0; i < currentPlacements.length; i++) {
        if (boxesOverlap(candidate.boxX, candidate.boxY,
                         currentPlacements[i].boxX, currentPlacements[i].boxY)) {
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
    return callouts.map((original) => ({ ...original, dx: 0, dy: -80 }));
  }
  console.log(`[exhaustive] Best score: ${bestScore}, candidates per node: ${candidatesPerNode.map(c => c.length).join(',')}, svgH=${visibleSvgHeight}`);

  return callouts.map((original, index) => {
    const p = bestPlacements[index];
    return {
      ...original,
      dx: p.boxX + BOX_WIDTH / 2 - nodes[index].subjectX,
      dy: p.boxY + ANCHOR_Y - nodes[index].subjectY,
    };
  });
}

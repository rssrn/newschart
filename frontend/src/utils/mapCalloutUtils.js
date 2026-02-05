// Note the force algorithm in this file is severely vibecoded with Anthropic Claude Sonnet 4.5
// Claude proposed its own test cases and iterated several times.
// The rails algorithm was added by Claude Opus 4.5 (claude-opus-4-5-20251101)

import { forceSimulation, forceCollide, forceX, forceY, forceManyBody } from 'd3-force';

const BOX_WIDTH = 135;
const BOX_HEIGHT = 100;
const EDGE_PADDING = 40;
const MAX_LINE_LENGTH = 180;
const SOUTHERN_LIMIT_RATIO = 0.75; // Don't allow boxes below 75% of map height

/**
 * Custom force to keep boxes within map bounds with stricter southern limit
 */
function forceBounds(mapLeft, mapTop, mapWidth, mapHeight) {
  let nodes;

  function force() {
    nodes.forEach(node => {
      const minX = mapLeft + EDGE_PADDING;
      const maxX = mapLeft + mapWidth - BOX_WIDTH - EDGE_PADDING;
      node.x = Math.max(minX, Math.min(maxX, node.x));

      const minY = mapTop + EDGE_PADDING;
      // Stricter southern limit - don't allow boxes in bottom 25% of map
      const maxY = mapTop + (mapHeight * SOUTHERN_LIMIT_RATIO) - BOX_HEIGHT - EDGE_PADDING;
      node.y = Math.max(minY, Math.min(maxY, node.y));
    });
  }

  force.initialize = (_) => nodes = _;
  return force;
}

/**
 * Custom force to push boxes away from their subject points
 */
function forceAvoidSubject(minRadius = 50) {
  let nodes;

  function force(alpha) {
    nodes.forEach(node => {
      const dx = node.x - node.subjectX;
      const dy = node.y - node.subjectY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minRadius && distance > 0) {
        const strength = (minRadius - distance) / minRadius * alpha;
        const pushX = (dx / distance) * strength * 15;
        const pushY = (dy / distance) * strength * 15;
        node.vx += pushX;
        node.vy += pushY;
      }
    });
  }

  force.initialize = (_) => nodes = _;
  return force;
}

/**
 * Custom force to keep connector lines short
 */
function forceShortLines(maxLength = MAX_LINE_LENGTH) {
  let nodes;

  function force(alpha) {
    nodes.forEach(node => {
      const dx = node.x - node.subjectX;
      const dy = node.y - node.subjectY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > maxLength) {
        const overshoot = distance - maxLength;
        const strength = (overshoot / maxLength) * alpha * 0.5;
        const pullX = -(dx / distance) * strength * distance;
        const pullY = -(dy / distance) * strength * distance;
        node.vx += pullX;
        node.vy += pullY;
      }
    });
  }

  force.initialize = (_) => nodes = _;
  return force;
}

/**
 * Custom force to strongly discourage placing boxes in southern regions
 */
function forceAvoidSouth(mapTop, mapHeight) {
  let nodes;

  function force(alpha) {
    const southThreshold = mapTop + mapHeight * 0.6; // Bottom 40% of map

    nodes.forEach(node => {
      // If box is in the southern region, push it upward strongly
      if (node.y > southThreshold) {
        const overshoot = node.y - southThreshold;
        const strength = (overshoot / (mapHeight * 0.4)) * alpha * 0.8; // Increased from 0.3
        node.vy -= strength * 100; // Increased from 50
      }

      // For subject points in southern hemisphere, bias initial placement upward
      if (node.subjectY > southThreshold) {
        node.vy -= alpha * 20;
      }
    });
  }

  force.initialize = (_) => nodes = _;
  return force;
}

/**
 * Detect clusters using hierarchical approach
 */
function detectClusters(nodes, maxDistance = 350) {
  const clusters = [];
  const assigned = new Set();

  // Sort by how many neighbors each node has (densest first)
  const nodeDensity = nodes.map((node, i) => {
    const neighborCount = nodes.filter((other, j) => {
      if (i === j) return false;
      const dist = Math.sqrt(
        Math.pow(node.subjectX - other.subjectX, 2) +
        Math.pow(node.subjectY - other.subjectY, 2)
      );
      return dist < maxDistance;
    }).length;
    return { index: i, density: neighborCount };
  });

  nodeDensity.sort((a, b) => b.density - a.density);

  // Build clusters starting with densest points
  nodeDensity.forEach(({ index: i }) => {
    if (assigned.has(i)) return;

    const cluster = [i];
    assigned.add(i);

    nodes.forEach((other, j) => {
      if (i === j || assigned.has(j)) return;

      const dist = Math.sqrt(
        Math.pow(nodes[i].subjectX - other.subjectX, 2) +
        Math.pow(nodes[i].subjectY - other.subjectY, 2)
      );

      if (dist < maxDistance) {
        cluster.push(j);
        assigned.add(j);
      }
    });

    clusters.push(cluster);
  });

  return clusters;
}

/**
 * Custom force for cluster layout - arrange boxes around cluster perimeter
 */
function forceClusterLayout(clusters, nodes, mapTop, mapHeight) {
  function force(alpha) {
    const southThreshold = mapTop + mapHeight * 0.6;

    clusters.forEach(clusterIndices => {
      if (clusterIndices.length <= 1) return;

      const clusterNodes = clusterIndices.map(i => nodes[i]);
      const centerX = clusterNodes.reduce((sum, n) => sum + n.subjectX, 0) / clusterNodes.length;
      const centerY = clusterNodes.reduce((sum, n) => sum + n.subjectY, 0) / clusterNodes.length;

      // Calculate how spread out the cluster is
      const distances = clusterNodes.map(n =>
        Math.sqrt(Math.pow(n.subjectX - centerX, 2) + Math.pow(n.subjectY - centerY, 2))
      );
      const maxDistFromCenter = Math.max(...distances);
      const avgDistFromCenter = distances.reduce((a, b) => a + b, 0) / distances.length;

      // Tight clusters (US east coast) vs loose clusters (Asia)
      const isTightCluster = maxDistFromCenter < 100 && avgDistFromCenter < 60;

      // Use smaller radius for tight clusters
      const baseRadius = isTightCluster ? 110 : 130;
      const radius = baseRadius + maxDistFromCenter * 0.3;

      // For tight clusters, use stronger force
      const strengthMultiplier = isTightCluster ? 0.25 : 0.2;

      clusterNodes.forEach((node, i) => {
        // Calculate angle based on subject point position relative to center
        const dx = node.subjectX - centerX;
        const dy = node.subjectY - centerY;
        const subjectAngle = Math.atan2(dy, dx);

        // Bias toward subject angle but add index offset to prevent overlap
        const indexOffset = (i - clusterNodes.length / 2) * 0.3;
        let angle = subjectAngle + indexOffset;

        // For southern clusters, bias angles upward (avoid bottom hemisphere)
        if (centerY > southThreshold) {
          // Clamp angle to upper hemisphere (between -π and 0)
          if (angle > 0) {
            angle = angle - Math.PI;
          }
        }

        const targetX = centerX + Math.cos(angle) * radius;
        const targetY = centerY + Math.sin(angle) * radius;

        // Pull toward target position
        const strength = strengthMultiplier * alpha;
        node.vx += (targetX - node.x) * strength;
        node.vy += (targetY - node.y) * strength;
      });
    });
  }

  force.initialize = () => {};
  return force;
}

/**
 * Force-based layout using d3-force simulation (original algorithm)
 */
function calculateOffsetsForce(callouts, projection) {
  if (!Array.isArray(callouts) || !projection) return [];

  const topLeft = projection([-180, 85]);
  const bottomRight = projection([180, -85]);
  const mapWidth = bottomRight[0] - topLeft[0];
  const mapHeight = bottomRight[1] - topLeft[1];
  const mapLeft = topLeft[0];
  const mapTop = topLeft[1];

  // Convert to screen coordinates with deterministic initial positions
  const nodes = callouts.map((callout, index) => {
    const [x, y] = projection([callout.country.longitude, callout.country.latitude]);

    // Use deterministic angle based on index
    let angle = (index * 2.4) + 0.5;

    // For points in southern hemisphere, bias initial placement upward
    const southThreshold = mapTop + mapHeight * 0.6;
    if (y > southThreshold) {
      // Force angle to upper hemisphere
      angle = -Math.abs(angle % Math.PI);
    }

    const distance = 70;

    return {
      ...callout,
      subjectX: x,
      subjectY: y,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      vx: 0,
      vy: 0
    };
  });

  // Detect clusters
  const clusters = detectClusters(nodes);

  // Calculate collision radius
  const collisionRadius = Math.sqrt(BOX_WIDTH * BOX_WIDTH + BOX_HEIGHT * BOX_HEIGHT) / 2 + 15;

  // Run force simulation
  const simulation = forceSimulation(nodes)
    // Prevent overlap (highest priority)
    .force('collide', forceCollide().radius(collisionRadius).strength(1).iterations(4))

    // Keep lines short (very high priority)
    .force('shortLines', forceShortLines(MAX_LINE_LENGTH))

    // Strongly discourage southern placement (high priority, applied early)
    .force('avoidSouth', forceAvoidSouth(mapTop, mapHeight))

    // Arrange clusters in circular pattern
    .force('clusterLayout', forceClusterLayout(clusters, nodes, mapTop, mapHeight))

    // Gentle attraction to subject points
    .force('x', forceX(d => d.subjectX).strength(0.02))
    .force('y', forceY(d => d.subjectY).strength(0.02))

    // Push away from subject points
    .force('avoidSubject', forceAvoidSubject(50))

    // Very gentle repulsion between boxes
    .force('charge', forceManyBody().strength(-15).distanceMax(250))

    // Keep within bounds with strict southern limit (applied last)
    .force('bounds', forceBounds(mapLeft, mapTop, mapWidth, mapHeight))

    .stop();

  // Run simulation
  for (let i = 0; i < 700; i++) {
    simulation.tick();
  }

  // Convert back to dx/dy offsets
  return callouts.map((original, index) => {
    const node = nodes[index];
    return {
      ...original,
      dx: node.x - node.subjectX,
      dy: node.y - node.subjectY
    };
  });
}

/**
 * Rails-based layout - places callouts along left/right edges of map
 * Western hemisphere countries go on left rail, eastern on right rail
 * Sorted by latitude (north to south)
 */
function calculateOffsetsRails(callouts, projection) {
  if (!Array.isArray(callouts) || !projection) return [];

  const topLeft = projection([-180, 85]);
  const bottomRight = projection([180, -85]);
  const mapWidth = bottomRight[0] - topLeft[0];
  const mapHeight = bottomRight[1] - topLeft[1];
  const mapLeft = topLeft[0];
  const mapTop = topLeft[1];

  // Convert to screen coordinates and tag with hemisphere
  const nodes = callouts.map((callout, index) => {
    const [x, y] = projection([callout.country.longitude, callout.country.latitude]);
    return {
      ...callout,
      index,
      subjectX: x,
      subjectY: y,
      isWest: callout.country.longitude < 0
    };
  });

  // Split into west and east groups
  const westNodes = nodes.filter(n => n.isWest).sort((a, b) => a.subjectY - b.subjectY);
  const eastNodes = nodes.filter(n => !n.isWest).sort((a, b) => a.subjectY - b.subjectY);

  // Calculate rail positions
  const leftRailX = mapLeft + EDGE_PADDING;
  const rightRailX = mapLeft + mapWidth - BOX_WIDTH - EDGE_PADDING;

  // Vertical spacing - use top 70% of map to avoid southern ocean area
  const usableHeight = mapHeight * 0.7;
  const startY = mapTop + EDGE_PADDING;

  // Position west nodes along left rail
  const westSpacing = westNodes.length > 1
    ? (usableHeight - BOX_HEIGHT) / (westNodes.length - 1)
    : 0;

  westNodes.forEach((node, i) => {
    node.targetX = leftRailX;
    node.targetY = startY + (i * westSpacing);
  });

  // Position east nodes along right rail
  const eastSpacing = eastNodes.length > 1
    ? (usableHeight - BOX_HEIGHT) / (eastNodes.length - 1)
    : 0;

  eastNodes.forEach((node, i) => {
    node.targetX = rightRailX;
    node.targetY = startY + (i * eastSpacing);
  });

  // Recombine and sort back to original order
  const allNodes = [...westNodes, ...eastNodes];
  allNodes.sort((a, b) => a.index - b.index);

  // Convert to dx/dy offsets
  return callouts.map((original, index) => {
    const node = allNodes[index];
    return {
      ...original,
      dx: node.targetX - node.subjectX,
      dy: node.targetY - node.subjectY
    };
  });
}

/**
 * Compass-based layout - tries preferred direction (NW) then rotates clockwise
 * until finding a spot that doesn't overlap existing callouts or go off-map
 *
 * @author Claude Opus 4.5 Anthropic
 */
function calculateOffsetsCompass(callouts, projection) {
  if (!Array.isArray(callouts) || !projection) return [];

  const topLeft = projection([-180, 85]);
  const bottomRight = projection([180, -85]);
  const mapWidth = bottomRight[0] - topLeft[0];
  const mapHeight = bottomRight[1] - topLeft[1];
  const mapLeft = topLeft[0];
  const mapTop = topLeft[1];

  const OFFSET_DISTANCES = [80, 100, 120, 145, 170, 200]; // Prioritize shorter distances

  // 8 compass directions - order will be customized per node
  const ALL_DIRECTIONS = [
    { name: 'NW', angle: -3 * Math.PI / 4 },
    { name: 'N',  angle: -Math.PI / 2 },
    { name: 'NE', angle: -Math.PI / 4 },
    { name: 'E',  angle: 0 },
    { name: 'SE', angle: Math.PI / 4 },
    { name: 'S',  angle: Math.PI / 2 },
    { name: 'SW', angle: 3 * Math.PI / 4 },
    { name: 'W',  angle: Math.PI }
  ];

  // Get preferred direction order based on:
  // 1. Y-rank among all nodes (to prevent connector crossings in vertical clusters)
  // 2. X position relative to map center (east vs west hemisphere)
  // yRank: 0 = northernmost, 1 = southernmost
  function getDirectionOrder(subjectX, subjectY, yRank) {
    const mapCenterX = mapLeft + mapWidth / 2;
    const isWestHemisphere = subjectX < mapCenterX;

    // Use Y-rank to determine vertical preference
    // Top third → prefer N, middle third → prefer E/W, bottom third → prefer S
    if (yRank < 0.33) {
      // Northern nodes → prefer N/NE/NW to keep boxes in north
      if (isWestHemisphere) {
        // NW, N, W, NE, SW, E, S, SE
        return [ALL_DIRECTIONS[0], ALL_DIRECTIONS[1], ALL_DIRECTIONS[7], ALL_DIRECTIONS[2], ALL_DIRECTIONS[6], ALL_DIRECTIONS[3], ALL_DIRECTIONS[5], ALL_DIRECTIONS[4]];
      } else {
        // NE, N, E, NW, SE, W, S, SW
        return [ALL_DIRECTIONS[2], ALL_DIRECTIONS[1], ALL_DIRECTIONS[3], ALL_DIRECTIONS[0], ALL_DIRECTIONS[4], ALL_DIRECTIONS[7], ALL_DIRECTIONS[5], ALL_DIRECTIONS[6]];
      }
    } else if (yRank > 0.67) {
      // Southern nodes → prefer S/SE/SW to keep boxes in south
      if (isWestHemisphere) {
        // SW, S, W, SE, NW, E, N, NE
        return [ALL_DIRECTIONS[6], ALL_DIRECTIONS[5], ALL_DIRECTIONS[7], ALL_DIRECTIONS[4], ALL_DIRECTIONS[0], ALL_DIRECTIONS[3], ALL_DIRECTIONS[1], ALL_DIRECTIONS[2]];
      } else {
        // SE, S, E, SW, NE, W, N, NW
        return [ALL_DIRECTIONS[4], ALL_DIRECTIONS[5], ALL_DIRECTIONS[3], ALL_DIRECTIONS[6], ALL_DIRECTIONS[2], ALL_DIRECTIONS[7], ALL_DIRECTIONS[1], ALL_DIRECTIONS[0]];
      }
    } else {
      // Middle nodes → prefer E/W (horizontal) to leave N/S for extremes
      if (isWestHemisphere) {
        // W, NW, SW, N, S, NE, SE, E
        return [ALL_DIRECTIONS[7], ALL_DIRECTIONS[0], ALL_DIRECTIONS[6], ALL_DIRECTIONS[1], ALL_DIRECTIONS[5], ALL_DIRECTIONS[2], ALL_DIRECTIONS[4], ALL_DIRECTIONS[3]];
      } else {
        // E, NE, SE, N, S, NW, SW, W
        return [ALL_DIRECTIONS[3], ALL_DIRECTIONS[2], ALL_DIRECTIONS[4], ALL_DIRECTIONS[1], ALL_DIRECTIONS[5], ALL_DIRECTIONS[0], ALL_DIRECTIONS[6], ALL_DIRECTIONS[7]];
      }
    }
  }

  // Track placed boxes with their subject points for connector checking
  const placedBoxes = [];

  // Check if two line segments intersect
  function segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.001) return false;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    return t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99;
  }

  // Check if a line segment intersects a box
  function lineIntersectsBox(x1, y1, x2, y2, box) {
    const padding = 5;
    const bx = box.x - padding;
    const by = box.y - padding;
    const bw = BOX_WIDTH + padding * 2;
    const bh = BOX_HEIGHT + padding * 2;

    // Check intersection with all 4 edges of the box
    return segmentsIntersect(x1, y1, x2, y2, bx, by, bx + bw, by) ||
           segmentsIntersect(x1, y1, x2, y2, bx + bw, by, bx + bw, by + bh) ||
           segmentsIntersect(x1, y1, x2, y2, bx + bw, by + bh, bx, by + bh) ||
           segmentsIntersect(x1, y1, x2, y2, bx, by + bh, bx, by);
  }

  // Check if a box at (x, y) with connector from (sx, sy) has any conflicts
  function hasConflict(x, y, subjectX, subjectY) {
    // Check map bounds - use reduced padding on left edge for western hemisphere subjects
    const mapCenterX = mapLeft + mapWidth / 2;
    const leftPadding = subjectX < mapCenterX ? 10 : EDGE_PADDING; // Less padding for western points
    const maxY = mapTop + (mapHeight * SOUTHERN_LIMIT_RATIO) - BOX_HEIGHT;
    if (x < mapLeft + leftPadding ||
        x > mapLeft + mapWidth - BOX_WIDTH - EDGE_PADDING ||
        y < mapTop + EDGE_PADDING ||
        y > maxY) {
      return true;
    }

    // Check if box would obscure any origin point (including our own and others)
    const originPadding = 15; // Keep boxes away from origin markers
    for (const node of nodes) {
      if (x - originPadding < node.subjectX && node.subjectX < x + BOX_WIDTH + originPadding &&
          y - originPadding < node.subjectY && node.subjectY < y + BOX_HEIGHT + originPadding) {
        return true;
      }
    }

    // Check overlap with placed boxes (with padding)
    const padding = 10;
    for (const box of placedBoxes) {
      if (x < box.x + BOX_WIDTH + padding &&
          x + BOX_WIDTH + padding > box.x &&
          y < box.y + BOX_HEIGHT + padding &&
          y + BOX_HEIGHT + padding > box.y) {
        return true;
      }
    }

    // Check if our connector would pass through any placed box
    const connectorEndX = x + BOX_WIDTH / 2;
    const connectorEndY = y + BOX_HEIGHT / 2;
    for (const box of placedBoxes) {
      if (lineIntersectsBox(subjectX, subjectY, connectorEndX, connectorEndY, box)) {
        return true;
      }
    }

    // Check if our connector crosses any existing connector
    for (const box of placedBoxes) {
      const existingConnectorEndX = box.x + BOX_WIDTH / 2;
      const existingConnectorEndY = box.y + BOX_HEIGHT / 2;
      if (segmentsIntersect(
        subjectX, subjectY, connectorEndX, connectorEndY,
        box.subjectX, box.subjectY, existingConnectorEndX, existingConnectorEndY
      )) {
        return true;
      }
    }

    // Check if any existing connector would pass through our new box
    const newBox = { x, y };
    for (const box of placedBoxes) {
      const existingConnectorEndX = box.x + BOX_WIDTH / 2;
      const existingConnectorEndY = box.y + BOX_HEIGHT / 2;
      if (lineIntersectsBox(box.subjectX, box.subjectY, existingConnectorEndX, existingConnectorEndY, newBox)) {
        return true;
      }
    }

    return false;
  }

  // Convert to screen coordinates
  const nodes = callouts.map((callout) => {
    const [x, y] = projection([callout.country.longitude, callout.country.latitude]);
    return {
      ...callout,
      subjectX: x,
      subjectY: y
    };
  });

  // Calculate Y-ranks for direction preferences (0 = northernmost, 1 = southernmost)
  // This ensures nodes maintain relative vertical ordering in their box positions
  const sortedByY = [...nodes].sort((a, b) => a.subjectY - b.subjectY);
  const yRanks = new Map();
  sortedByY.forEach((node, index) => {
    yRanks.set(node, nodes.length > 1 ? index / (nodes.length - 1) : 0.5);
  });

  // Sort nodes by Y (north first) to ensure northern subject points get northern box positions
  // This prevents connector crossings when boxes are vertically stacked
  const sortedIndices = nodes
    .map((node, i) => ({ i, y: node.subjectY, x: node.subjectX }))
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map(item => item.i);

  // Place each callout in sorted order
  sortedIndices.forEach(nodeIndex => {
    const node = nodes[nodeIndex];
    let placed = false;
    const directions = getDirectionOrder(node.subjectX, node.subjectY, yRanks.get(node));

    // Try each distance, then each direction
    for (const distance of OFFSET_DISTANCES) {
      if (placed) break;

      for (const dir of directions) {
        const boxX = node.subjectX + Math.cos(dir.angle) * distance - BOX_WIDTH / 2;
        const boxY = node.subjectY + Math.sin(dir.angle) * distance - BOX_HEIGHT / 2;

        if (!hasConflict(boxX, boxY, node.subjectX, node.subjectY)) {
          node.targetX = boxX;
          node.targetY = boxY;
          placedBoxes.push({ x: boxX, y: boxY, subjectX: node.subjectX, subjectY: node.subjectY });
          placed = true;
          break;
        }
      }
    }

    // Fallback: relax connector crossing constraint and try again
    if (!placed) {
      for (const distance of OFFSET_DISTANCES) {
        if (placed) break;
        for (const dir of directions) {
          const boxX = node.subjectX + Math.cos(dir.angle) * distance - BOX_WIDTH / 2;
          const boxY = node.subjectY + Math.sin(dir.angle) * distance - BOX_HEIGHT / 2;

          // Only check bounds and box overlap, ignore connector conflicts
          const maxY = mapTop + (mapHeight * SOUTHERN_LIMIT_RATIO) - BOX_HEIGHT;
          const mapCenterX = mapLeft + mapWidth / 2;
          const leftPad = node.subjectX < mapCenterX ? 10 : EDGE_PADDING;
          const inBounds = boxX >= mapLeft + leftPad &&
                          boxX <= mapLeft + mapWidth - BOX_WIDTH - EDGE_PADDING &&
                          boxY >= mapTop + EDGE_PADDING &&
                          boxY <= maxY;

          let boxOverlap = false;
          for (const box of placedBoxes) {
            if (boxX < box.x + BOX_WIDTH + 10 && boxX + BOX_WIDTH + 10 > box.x &&
                boxY < box.y + BOX_HEIGHT + 10 && boxY + BOX_HEIGHT + 10 > box.y) {
              boxOverlap = true;
              break;
            }
          }

          if (inBounds && !boxOverlap) {
            node.targetX = boxX;
            node.targetY = boxY;
            placedBoxes.push({ x: boxX, y: boxY, subjectX: node.subjectX, subjectY: node.subjectY });
            placed = true;
            break;
          }
        }
      }
    }

    // Final fallback: try harder with extended distances, checking box overlap and connector-through-box
    if (!placed) {
      const extendedDistances = [...OFFSET_DISTANCES, 230, 260, 300];
      outerLoop:
      for (const distance of extendedDistances) {
        for (const dir of directions) {
          const boxX = node.subjectX + Math.cos(dir.angle) * distance - BOX_WIDTH / 2;
          const boxY = node.subjectY + Math.sin(dir.angle) * distance - BOX_HEIGHT / 2;

          // Check bounds (relaxed)
          const inBounds = boxX >= mapLeft + 5 &&
                          boxX <= mapLeft + mapWidth - BOX_WIDTH - 5 &&
                          boxY >= mapTop + 5 &&
                          boxY <= mapTop + mapHeight - BOX_HEIGHT - 5;
          if (!inBounds) continue;

          // Check box overlap
          let boxOverlap = false;
          for (const box of placedBoxes) {
            if (boxX < box.x + BOX_WIDTH + 5 && boxX + BOX_WIDTH + 5 > box.x &&
                boxY < box.y + BOX_HEIGHT + 5 && boxY + BOX_HEIGHT + 5 > box.y) {
              boxOverlap = true;
              break;
            }
          }
          if (boxOverlap) continue;

          // Check if our connector passes through any placed box
          const connectorEndX = boxX + BOX_WIDTH / 2;
          const connectorEndY = boxY + BOX_HEIGHT / 2;
          let connectorThroughBox = false;
          for (const box of placedBoxes) {
            if (lineIntersectsBox(node.subjectX, node.subjectY, connectorEndX, connectorEndY, box)) {
              connectorThroughBox = true;
              break;
            }
          }
          if (connectorThroughBox) continue;

          node.targetX = boxX;
          node.targetY = boxY;
          placedBoxes.push({ x: boxX, y: boxY, subjectX: node.subjectX, subjectY: node.subjectY });
          placed = true;
          break outerLoop;
        }
      }
    }

    // Absolute last resort: place at first direction, longest distance (may overlap)
    if (!placed) {
      const distance = 300;
      const dir = directions[0];
      node.targetX = node.subjectX + Math.cos(dir.angle) * distance - BOX_WIDTH / 2;
      node.targetY = node.subjectY + Math.sin(dir.angle) * distance - BOX_HEIGHT / 2;
      placedBoxes.push({ x: node.targetX, y: node.targetY, subjectX: node.subjectX, subjectY: node.subjectY });
    }
  });

  // Convert to dx/dy offsets (from subject point to box centre)
  return callouts.map((original, index) => {
    const node = nodes[index];
    return {
      ...original,
      dx: node.targetX + BOX_WIDTH / 2 - node.subjectX,
      dy: node.targetY + BOX_HEIGHT / 2 - node.subjectY
    };
  });
}

/**
 * Four-winds layout - assigns each point to one of 4 diagonal directions (NW, NE, SW, SE)
 * based on which "wind" (diagonal extreme) it represents.
 *
 * Algorithm:
 * 1. NW: Find point with min(x + y) - first hit by 45° line pushed SE. Box goes NW.
 * 2. NE: Find point with max(x - y) - most NE of remaining. Box goes NE.
 * 3. SW: Find point with min(x - y) - most SW of remaining. Box goes SW.
 * 4. SE: Find point with max(x + y) - most SE of remaining. Box goes SE.
 *
 * @author Claude Opus 4.5 Anthropic
 */
function calculateOffsetsFourWinds(callouts, projection) {
  if (!Array.isArray(callouts) || !projection) return [];

  const topLeft = projection([-180, 85]);
  const bottomRight = projection([180, -85]);
  const mapWidth = bottomRight[0] - topLeft[0];
  const mapHeight = bottomRight[1] - topLeft[1];
  const mapLeft = topLeft[0];
  const mapTop = topLeft[1];

  // Convert to screen coordinates
  const nodes = callouts.map((callout) => {
    const [x, y] = projection([callout.country.longitude, callout.country.latitude]);
    return {
      ...callout,
      subjectX: x,
      subjectY: y,
      assigned: false,
      angle: null
    };
  });

  // Define the four winds - order matters (NW first, then NE, SW, SE)
  // Each wind finds an extreme point based on a scoring function
  const winds = [
    { name: 'NW', angle: -3 * Math.PI / 4, scoreFn: (n) => n.subjectX + n.subjectY, findMin: true },
    { name: 'NE', angle: -Math.PI / 4, scoreFn: (n) => n.subjectX - n.subjectY, findMin: false },
    { name: 'SW', angle: 3 * Math.PI / 4, scoreFn: (n) => n.subjectX - n.subjectY, findMin: true },
    { name: 'SE', angle: Math.PI / 4, scoreFn: (n) => n.subjectX + n.subjectY, findMin: false },
  ];

  // Assign each wind to the most extreme unassigned point
  for (const wind of winds) {
    const unassigned = nodes.filter(n => !n.assigned);
    if (unassigned.length === 0) break;

    // Find the extreme point for this wind
    let extreme = unassigned[0];
    let extremeScore = wind.scoreFn(extreme);

    for (const node of unassigned) {
      const score = wind.scoreFn(node);
      if ((wind.findMin && score < extremeScore) || (!wind.findMin && score > extremeScore)) {
        extreme = node;
        extremeScore = score;
      }
    }

    extreme.assigned = true;
    extreme.angle = wind.angle;
  }

  // Place boxes at calculated distance in assigned direction, with overlap detection
  const BASE_DISTANCE = 115;
  const MAX_DISTANCE = 400;
  const DISTANCE_INCREMENT = 8;
  const BOX_PADDING = 35;

  // Map bounds for clamping
  const minX = mapLeft + EDGE_PADDING;
  const maxX = mapLeft + mapWidth - BOX_WIDTH - EDGE_PADDING;
  const minY = mapTop + EDGE_PADDING;
  const maxY = mapTop + (mapHeight * SOUTHERN_LIMIT_RATIO) - BOX_HEIGHT - EDGE_PADDING;

  // Track placed boxes for overlap detection
  const placedBoxes = [];

  // Helper to check if two boxes overlap (with padding)
  function boxesOverlap(box1, box2) {
    return box1.x < box2.x + BOX_WIDTH + BOX_PADDING &&
           box1.x + BOX_WIDTH + BOX_PADDING > box2.x &&
           box1.y < box2.y + BOX_HEIGHT + BOX_PADDING &&
           box1.y + BOX_HEIGHT + BOX_PADDING > box2.y;
  }

  // Place each node, checking for overlaps
  for (const node of nodes) {
    if (node.assigned && node.angle !== null) {
      let placed = false;
      let lastBoxX, lastBoxY;

      // Try increasing distances until no overlap
      for (let distance = BASE_DISTANCE; distance <= MAX_DISTANCE && !placed; distance += DISTANCE_INCREMENT) {
        let boxX = node.subjectX + Math.cos(node.angle) * distance - BOX_WIDTH / 2;
        let boxY = node.subjectY + Math.sin(node.angle) * distance - BOX_HEIGHT / 2;

        // Clamp to map bounds
        boxX = Math.max(minX, Math.min(maxX, boxX));
        boxY = Math.max(minY, Math.min(maxY, boxY));

        lastBoxX = boxX;
        lastBoxY = boxY;

        // Check for overlap with already-placed boxes
        const candidateBox = { x: boxX, y: boxY };
        const hasOverlap = placedBoxes.some(box => boxesOverlap(candidateBox, box));

        if (!hasOverlap) {
          node.targetX = boxX;
          node.targetY = boxY;
          placedBoxes.push(candidateBox);
          placed = true;
        }
      }

      // If still not placed, try shifting perpendicular to the angle
      if (!placed) {
        const perpAngle = node.angle + Math.PI / 2;
        for (const shift of [-50, 50, -100, 100, -150, 150]) {
          let boxX = lastBoxX + Math.cos(perpAngle) * shift;
          let boxY = lastBoxY + Math.sin(perpAngle) * shift;

          boxX = Math.max(minX, Math.min(maxX, boxX));
          boxY = Math.max(minY, Math.min(maxY, boxY));

          const candidateBox = { x: boxX, y: boxY };
          const hasOverlap = placedBoxes.some(box => boxesOverlap(candidateBox, box));

          if (!hasOverlap) {
            node.targetX = boxX;
            node.targetY = boxY;
            placedBoxes.push(candidateBox);
            placed = true;
            break;
          }
        }
      }

      // Final fallback
      if (!placed) {
        node.targetX = lastBoxX;
        node.targetY = lastBoxY;
        placedBoxes.push({ x: lastBoxX, y: lastBoxY });
      }
    } else {
      // Fallback for unassigned nodes (more than 4 points)
      node.targetX = node.subjectX - BOX_WIDTH / 2;
      node.targetY = node.subjectY - BOX_HEIGHT / 2 - BASE_DISTANCE;
    }
  }

  // Convert to dx/dy offsets (from subject point to box center)
  return callouts.map((original, index) => {
    const node = nodes[index];
    return {
      ...original,
      dx: node.targetX + BOX_WIDTH / 2 - node.subjectX,
      dy: node.targetY + BOX_HEIGHT / 2 - node.subjectY
    };
  });
}

/**
 * Exhaustive candidate enumeration layout - generates candidate positions for each
 * callout, evaluates every combination, and picks the one with the lowest penalty score.
 *
 * With N=3-4 labels and ~20-30 candidates each this is trivially fast (<1ms) and
 * guarantees finding the optimal layout for the given candidate set.
 *
 * Based on the Point-Feature Label Placement (PFLP) literature.
 *
 * @author Claude Opus 4.6 Anthropic
 */
function calculateOffsetsExhaustive(callouts, projection, visibleSvgHeight = 600) {
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
    const bh = BOX_HEIGHT + pad * 2;
    return segmentsIntersect(x1, y1, x2, y2, bx, by, bx + bw, by) ||
           segmentsIntersect(x1, y1, x2, y2, bx + bw, by, bx + bw, by + bh) ||
           segmentsIntersect(x1, y1, x2, y2, bx + bw, by + bh, bx, by + bh) ||
           segmentsIntersect(x1, y1, x2, y2, bx, by + bh, bx, by);
  }

  function boxesOverlap(ax, ay, bx, by) {
    const pad = 10; // minimum spacing between boxes
    return ax < bx + BOX_WIDTH + pad &&
           ax + BOX_WIDTH + pad > bx &&
           ay < by + BOX_HEIGHT + pad &&
           ay + BOX_HEIGHT + pad > by;
  }

  // --- Step 1: Viewport bounds for candidate filtering ---
  const boundsMinX = EDGE_PADDING;
  const boundsMaxX = SVG_WIDTH - BOX_WIDTH - EDGE_PADDING;
  const boundsMinY = EDGE_PADDING;
  const boundsMaxY = visibleSvgHeight - BOX_HEIGHT - EDGE_PADDING;

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
  const DISTANCES = [80, 110, 145, 185];
  const ORIGIN_PADDING = 15;

  const candidatesPerNode = nodes.map((node) => {
    const candidates = [];
    for (const dir of DIRECTIONS) {
      for (const dist of DISTANCES) {
        // Box top-left so that box centre lands at the candidate point
        const boxX = node.subjectX + Math.cos(dir.angle) * dist - BOX_WIDTH / 2;
        const boxY = node.subjectY + Math.sin(dir.angle) * dist - BOX_HEIGHT / 2;

        // Hard reject: any part of box outside map bounds
        if (boxX < boundsMinX || boxX > boundsMaxX ||
            boxY < boundsMinY || boxY > boundsMaxY) {
          continue;
        }

        // Hard reject: box would obscure any origin point
        let obscuresOrigin = false;
        for (const n of nodes) {
          if (boxX - ORIGIN_PADDING < n.subjectX && n.subjectX < boxX + BOX_WIDTH + ORIGIN_PADDING &&
              boxY - ORIGIN_PADDING < n.subjectY && n.subjectY < boxY + BOX_HEIGHT + ORIGIN_PADDING) {
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
      // Connector from subject point to box centre
      const ciX = pi.boxX + BOX_WIDTH / 2;
      const ciY = pi.boxY + BOX_HEIGHT / 2;

      for (let j = i + 1; j < n; j++) {
        const pj = placements[j];
        const nj = nodes[j];
        const cjX = pj.boxX + BOX_WIDTH / 2;
        const cjY = pj.boxY + BOX_HEIGHT / 2;

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
    console.warn(`[exhaustive] No valid combination found (${nodes.length} nodes, candidates per node: ${candidatesPerNode.map(c => c.length).join(',')}). Falling back to compass.`);
    return calculateOffsetsCompass(callouts, projection);
  }
  console.log(`[exhaustive] Best score: ${bestScore}, candidates per node: ${candidatesPerNode.map(c => c.length).join(',')}`);

  return callouts.map((original, index) => {
    const p = bestPlacements[index];
    return {
      ...original,
      dx: p.boxX + BOX_WIDTH / 2 - nodes[index].subjectX,
      dy: p.boxY + BOX_HEIGHT / 2 - nodes[index].subjectY,
    };
  });
}

/**
 * Main entry point - selects algorithm based on parameter
 * @param {Array} callouts - Array of callout objects with country data
 * @param {Function} projection - Map projection function
 * @param {string} algorithm - 'exhaustive' (default), 'force', 'rails', 'compass', or 'four-winds'
 * @param {number} visibleSvgHeight - Visible SVG height in SVG coordinates (accounts for viewport clipping)
 */
export function calculateOffsets(callouts, projection, algorithm = 'exhaustive', visibleSvgHeight = 600) {
  switch (algorithm) {
    case 'exhaustive':
      return calculateOffsetsExhaustive(callouts, projection, visibleSvgHeight);
    case 'four-winds':
      return calculateOffsetsFourWinds(callouts, projection);
    case 'rails':
      return calculateOffsetsRails(callouts, projection);
    case 'compass':
      return calculateOffsetsCompass(callouts, projection);
    case 'force':
    default:
      return calculateOffsetsForce(callouts, projection);
  }
}
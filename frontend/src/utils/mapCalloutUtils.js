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

  // Get preferred direction order based on subject position relative to cluster centroid
  // This helps connectors fan out rather than cross
  function getDirectionOrder(subjectX, subjectY, centroidX, centroidY) {
    const isNorth = subjectY < centroidY;
    const isSouth = subjectY > centroidY;
    const isWest = subjectX < centroidX;
    const isEast = subjectX > centroidX;

    // Also consider map edge - western hemisphere points need westward options
    const mapCenterX = mapLeft + mapWidth / 2;
    const nearWestEdge = subjectX < mapCenterX;

    if (isNorth && isWest) {
      // NW of cluster → prefer NW, W, N
      return [ALL_DIRECTIONS[0], ALL_DIRECTIONS[7], ALL_DIRECTIONS[1], ALL_DIRECTIONS[6], ALL_DIRECTIONS[2], ALL_DIRECTIONS[5], ALL_DIRECTIONS[3], ALL_DIRECTIONS[4]];
    } else if (isNorth && isEast) {
      // NE of cluster → prefer NE, E, N
      return [ALL_DIRECTIONS[2], ALL_DIRECTIONS[3], ALL_DIRECTIONS[1], ALL_DIRECTIONS[4], ALL_DIRECTIONS[0], ALL_DIRECTIONS[5], ALL_DIRECTIONS[7], ALL_DIRECTIONS[6]];
    } else if (isSouth && isWest) {
      // SW of cluster → prefer SW, W, S
      return [ALL_DIRECTIONS[6], ALL_DIRECTIONS[7], ALL_DIRECTIONS[5], ALL_DIRECTIONS[0], ALL_DIRECTIONS[4], ALL_DIRECTIONS[1], ALL_DIRECTIONS[3], ALL_DIRECTIONS[2]];
    } else if (isSouth && isEast) {
      // SE of cluster → prefer SE, E, S
      return [ALL_DIRECTIONS[4], ALL_DIRECTIONS[3], ALL_DIRECTIONS[5], ALL_DIRECTIONS[2], ALL_DIRECTIONS[6], ALL_DIRECTIONS[1], ALL_DIRECTIONS[7], ALL_DIRECTIONS[0]];
    } else if (isNorth) {
      // Due N → prefer N, NW, NE
      return [ALL_DIRECTIONS[1], ALL_DIRECTIONS[0], ALL_DIRECTIONS[2], ALL_DIRECTIONS[7], ALL_DIRECTIONS[3], ALL_DIRECTIONS[6], ALL_DIRECTIONS[4], ALL_DIRECTIONS[5]];
    } else if (isSouth) {
      // Due S → prefer S, SW, SE
      return [ALL_DIRECTIONS[5], ALL_DIRECTIONS[6], ALL_DIRECTIONS[4], ALL_DIRECTIONS[7], ALL_DIRECTIONS[3], ALL_DIRECTIONS[0], ALL_DIRECTIONS[2], ALL_DIRECTIONS[1]];
    } else if (nearWestEdge) {
      // Default for western hemisphere
      return [ALL_DIRECTIONS[0], ALL_DIRECTIONS[7], ALL_DIRECTIONS[6], ALL_DIRECTIONS[1], ALL_DIRECTIONS[5], ALL_DIRECTIONS[2], ALL_DIRECTIONS[3], ALL_DIRECTIONS[4]];
    } else {
      // Default for eastern hemisphere
      return [ALL_DIRECTIONS[2], ALL_DIRECTIONS[3], ALL_DIRECTIONS[4], ALL_DIRECTIONS[1], ALL_DIRECTIONS[5], ALL_DIRECTIONS[0], ALL_DIRECTIONS[7], ALL_DIRECTIONS[6]];
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

  // Calculate cluster centroid for direction preferences
  const centroidX = nodes.reduce((sum, n) => sum + n.subjectX, 0) / nodes.length;
  const centroidY = nodes.reduce((sum, n) => sum + n.subjectY, 0) / nodes.length;

  // Sort nodes: process from top-left to bottom-right so NW placement is given to NW-most points
  const sortedIndices = nodes
    .map((node, i) => ({ i, score: node.subjectX + node.subjectY }))
    .sort((a, b) => a.score - b.score)
    .map(item => item.i);

  // Place each callout in sorted order
  sortedIndices.forEach(nodeIndex => {
    const node = nodes[nodeIndex];
    let placed = false;
    const directions = getDirectionOrder(node.subjectX, node.subjectY, centroidX, centroidY);

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

    // Final fallback: force placement
    if (!placed) {
      const distance = OFFSET_DISTANCES[2];
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
 * Main entry point - selects algorithm based on parameter
 * @param {Array} callouts - Array of callout objects with country data
 * @param {Function} projection - Map projection function
 * @param {string} algorithm - 'force' (default), 'rails', or 'compass'
 */
export function calculateOffsets(callouts, projection, algorithm = 'force') {
  switch (algorithm) {
    case 'rails':
      return calculateOffsetsRails(callouts, projection);
    case 'compass':
      return calculateOffsetsCompass(callouts, projection);
    case 'force':
    default:
      return calculateOffsetsForce(callouts, projection);
  }
}
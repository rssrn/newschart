// Note this file is severely vibecoded with Anthropic Claude Sonnet 4.5
// Claude proposed its own test cases and iterated several times.

import { forceSimulation, forceCollide, forceX, forceY, forceManyBody } from 'd3-force';

const BOX_WIDTH = 200;
const BOX_HEIGHT = 150;
const EDGE_PADDING = 40;
const MAX_LINE_LENGTH = 180;

/**
 * Custom force to keep boxes within map bounds
 */
function forceBounds(mapLeft, mapTop, mapWidth, mapHeight) {
  let nodes;

  function force() {
    nodes.forEach(node => {
      const minX = mapLeft + EDGE_PADDING;
      const maxX = mapLeft + mapWidth - BOX_WIDTH - EDGE_PADDING;
      node.x = Math.max(minX, Math.min(maxX, node.x));

      const minY = mapTop + EDGE_PADDING;
      const maxY = mapTop + mapHeight - BOX_HEIGHT - EDGE_PADDING;
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
function forceClusterLayout(clusters, nodes) {
  function force(alpha) {
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
        const angle = subjectAngle + indexOffset;

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

export function calculateOffsets(callouts, projection) {
  if (!Array.isArray(callouts) || !projection) return [];

  const topLeft = projection([-180, 85]);
  const bottomRight = projection([180, -85]);
  const mapWidth = bottomRight[0] - topLeft[0];
  const mapHeight = bottomRight[1] - topLeft[1];
  const mapLeft = topLeft[0];
  const mapTop = topLeft[1];

  // Convert to screen coordinates with deterministic initial positions
  const nodes = callouts.map((callout, index) => {
    const [x, y] = projection([callout.latLong.longitude, callout.latLong.latitude]);

    // Use deterministic angle based on index (not random)
    const angle = (index * 2.4) + 0.5; // Golden angle approximation for even distribution
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

    // Arrange clusters in circular pattern (high priority)
    .force('clusterLayout', forceClusterLayout(clusters, nodes))

    // Gentle attraction to subject points
    .force('x', forceX(d => d.subjectX).strength(0.02))
    .force('y', forceY(d => d.subjectY).strength(0.02))

    // Push away from subject points
    .force('avoidSubject', forceAvoidSubject(50))

    // Very gentle repulsion between boxes
    .force('charge', forceManyBody().strength(-15).distanceMax(250))

    // Keep within bounds
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
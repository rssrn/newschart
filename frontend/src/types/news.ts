/**
 * Shared TypeScript type definitions for NewsChart domain model.
 *
 * @author Claude Sonnet 4.5 Anthropic
 */

/**
 * Geographic country data with coordinates.
 */
export interface Country {
  latitude: number;
  longitude: number;
  name: string;
  iso2: string;       // Two-letter country code (e.g., "US", "GB")
  isoNumeric?: string; // Three-digit ISO 3166-1 numeric code (e.g., "840", "016")
}

/**
 * A news story callout with geographic location.
 * Fetched from the backend API.
 */
export interface StoryCallout {
  headline: string;
  detail: string;
  extendedDetail?: string;
  country: Country;
  type?: string;
  source?: string;
  generatedAt?: string;
}

/**
 * A story callout with calculated position offsets for rendering.
 * The dx/dy values position the callout box relative to the country point.
 */
export interface PositionedCallout extends StoryCallout {
  dx: number;  // Horizontal offset from country point
  dy: number;  // Vertical offset from country point
}

/**
 * Internal layout node with screen coordinates.
 * Used within the layout algorithm to track both source data and projected position.
 */
export interface LayoutNode extends StoryCallout {
  subjectX: number;  // X coordinate in SVG space (projected from longitude)
  subjectY: number;  // Y coordinate in SVG space (projected from latitude)
}

/**
 * A candidate position for a callout box during layout calculation.
 */
export interface LayoutCandidate {
  boxX: number;    // Top-left X coordinate of the callout box
  boxY: number;    // Top-left Y coordinate of the callout box
  dist: number;    // Distance from the subject point (used for scoring)
  angle: number;   // Direction angle in radians (used for diagonal bias penalty)
}

/**
 * Viewport dimensions in pixels.
 */
export interface ViewportSize {
  w: number;  // Width in pixels
  h: number;  // Height in pixels
}

/**
 * Map projection function type from d3-geo.
 * Projects [longitude, latitude] to [x, y] screen coordinates.
 * Returns null if the point cannot be projected (e.g., outside projection bounds).
 */
export type MapProjection = (point: [number, number]) => [number, number] | null;

/**
 * A layout candidate annotated with a rejection reason (if it was filtered out).
 * Used in layout diagnostics to show why candidates were discarded.
 *
 * @author Claude Sonnet 4.6 Anthropic
 */
export interface CandidateDiag extends LayoutCandidate {
  rejectedReason?: 'out-of-bounds' | 'obscures-origin';
}

/**
 * Per-penalty-term score totals for the winning layout combination.
 *
 * @author Claude Sonnet 4.6 Anthropic
 */
export interface ScoreBreakdown {
  connectorLength: number;
  crossing: number;
  throughBox: number;
  originProximity: number;
  angularSpread: number;
  diagonalBias: number;
  verticalClustering: number;
}

/**
 * Diagnostics for a single callout node in the winning layout.
 *
 * @author Claude Sonnet 4.6 Anthropic
 */
export interface NodeDiagnostics {
  allCandidates: CandidateDiag[];
  chosenCandidate: LayoutCandidate;
  scoreContribution: ScoreBreakdown;
}

/**
 * Full diagnostics returned by calculateOffsetsWithDiagnostics.
 *
 * @author Claude Sonnet 4.6 Anthropic
 */
export interface LayoutDiagnostics {
  nodes: NodeDiagnostics[];
  bestScore: number;
  combinationsEvaluated: number;
}

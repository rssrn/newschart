// @author Claude Sonnet 4.6 Anthropic
// Inferno-inspired sequential scale: sqrt scaling, dark red-brown → vivid orange.
// globalMax must be computed across ALL sources so the same colour means the same count.

const STOPS = [
  { at: 0,    r: 74,  g: 16,  b: 3   },
  { at: 0.3,  r: 124, g: 45,  b: 18  },
  { at: 0.55, r: 194, g: 65,  b: 12  },
  { at: 0.8,  r: 234, g: 88,  b: 12  },
  { at: 1.0,  r: 249, g: 115, b: 22  },
];

export function heatmapColor(count: number, globalMax: number): string {
  const t = Math.sqrt(count / globalMax);
  let lo = STOPS[0], hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (t >= STOPS[i].at && t <= STOPS[i + 1].at) { lo = STOPS[i]; hi = STOPS[i + 1]; break; }
  }
  const range = hi.at - lo.at;
  const f = range === 0 ? 1 : (t - lo.at) / range;
  return `rgb(${Math.round(lo.r + f*(hi.r-lo.r))},${Math.round(lo.g + f*(hi.g-lo.g))},${Math.round(lo.b + f*(hi.b-lo.b))})`;
}

// Returns a CSS linear-gradient string covering only the colour range actually used
// by the current source (count=1 up to sourceMax), normalised against globalMax.
export function heatmapLegendGradient(sourceMax: number, globalMax: number): string {
  const samples = sourceMax <= 1
    ? [1]
    : [1, ...Array.from({ length: 3 }, (_, i) => Math.round(1 + ((i + 1) / 4) * (sourceMax - 1))), sourceMax];
  const unique = [...new Set(samples)];
  return `linear-gradient(to right, ${unique.map(c => heatmapColor(c, globalMax)).join(', ')})`;
}

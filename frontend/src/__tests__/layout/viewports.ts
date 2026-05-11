// @author Claude Sonnet 4.6 Anthropic

export interface Viewport {
  name: string;
  w: number; // window.innerWidth
  h: number; // window.innerHeight
}

export interface ViewportParams {
  name: string;
  w: number;
  h: number;
  visibleSvgHeight: number;
  bottomPaddingSvg: number;
}

const SVG_WIDTH = 800;

export function deriveParams(viewport: Viewport, bottomReservedPx: number): ViewportParams {
  const visibleSvgHeight = Math.min(600, SVG_WIDTH * (viewport.h / viewport.w));
  const bottomPaddingSvg = bottomReservedPx * (SVG_WIDTH / viewport.w);
  return { ...viewport, visibleSvgHeight, bottomPaddingSvg };
}

// Two representative viewports for milestone 1.
// Full matrix (9 viewports × 2 strip states) lives in the final plan.
export const VIEWPORTS: Viewport[] = [
  {
    name: 'desktop-fhd-typ',
    w: 1920,
    h: 945,
    // 1920×1080 maximised with tab strip + bookmark bar + OS taskbar → innerH ≈ 945
    // visibleSvgHeight ≈ 394 (tight — exercises the algorithm under vertical pressure)
  },
  {
    name: 'phone-large',
    w: 414,
    h: 715,
    // iPhone XR/11 414×896 Safari with address bar visible → innerH ≈ 715
    // visibleSvgHeight = 600 (capped — wide open vertically, but narrow horizontally)
  },
];

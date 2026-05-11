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

export const VIEWPORTS: Viewport[] = [
  {
    name: 'desktop-fhd-typ',
    w: 1920,
    h: 945,
    // 1920×1080 maximised, tab strip + bookmark bar + OS taskbar → visibleSvgHeight ≈ 394 (tightest FHD)
  },
  {
    name: 'desktop-fhd-bare',
    w: 1920,
    h: 1030,
    // 1920×1080 maximised, tab strip only (no bookmark bar/taskbar) → visibleSvgHeight ≈ 429
  },
  {
    name: 'laptop-1440-typ',
    w: 1440,
    h: 770,
    // 1440×900 maximised, tab strip + bookmark bar + dock → visibleSvgHeight ≈ 428
  },
  {
    name: 'laptop-1366-typ',
    w: 1366,
    h: 625,
    // 1366×768 maximised, tab strip + bookmark bar + taskbar → visibleSvgHeight ≈ 366 (tightest desktop)
  },
  {
    name: 'tablet-landscape',
    w: 1024,
    h: 695,
    // iPad 1024×768 Safari landscape, toolbar visible → visibleSvgHeight ≈ 543
  },
  {
    name: 'tablet-portrait',
    w: 768,
    h: 955,
    // iPad 768×1024 Safari portrait, toolbar visible → visibleSvgHeight = 600 (capped)
  },
  {
    name: 'phone-large',
    w: 414,
    h: 715,
    // iPhone XR/11 414×896 Safari, address bar visible → visibleSvgHeight = 600 (capped)
  },
  {
    name: 'phone-standard',
    w: 390,
    h: 660,
    // iPhone 13/14 390×844 Safari, address bar visible → visibleSvgHeight = 600 (capped)
  },
  {
    name: 'phone-small',
    w: 360,
    h: 510,
    // budget Android 360×640 Chrome, toolbar visible → visibleSvgHeight = 600 (capped)
  },
];

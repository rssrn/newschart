/*
 * Shared scaffolding for issue #50 mockups (consensus / divergence views).
 * Static mock — visual design exploration only, not production code.
 * @author Claude Fable 5 Anthropic
 */

const W = 1914;
const H = 885;

const COLORS = {
  bg: '#0f1923',
  land: '#1e2d3d',
  border: '#2d4257',
  activeFill: '#1d4ed8',
  activeStroke: '#60a5fa',
  panelBg: 'rgba(10, 20, 35, 0.88)',
  purple: '#7c3aed',
};

const SOURCE_META = {
  GEMINI:     { letter: 'G', name: 'Gemini',     color: '#4285F4' },
  PERPLEXITY: { letter: 'P', name: 'Perplexity', color: '#20B8CD' },
  OPENAI:     { letter: 'C', name: 'ChatGPT',    color: '#10A37F' },
  NYT:        { letter: 'N', name: 'NYT',        color: '#d1d5db' },
};
const SOURCE_ORDER = ['GEMINI', 'PERPLEXITY', 'OPENAI', 'NYT'];

function makeProjection() {
  return d3.geoMercator()
    .scale(W / (2 * Math.PI))
    .center([12, 42])
    .translate([W / 2, H / 2]);
}

async function loadCountries() {
  const topo = await (await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')).json();
  return topojson.feature(topo, topo.objects.countries).features;
}

/* Renders the base world map into #map svg; styleFn(feature) may return
   {fill, stroke, strokeWidth, glow} overrides per country. */
async function drawBaseMap(styleFn) {
  const features = await loadCountries();
  const projection = makeProjection();
  const path = d3.geoPath(projection);
  const svg = d3.select('#map')
    .attr('width', W).attr('height', H)
    .attr('viewBox', `0 0 ${W} ${H}`);

  const g = svg.append('g');
  for (const f of features) {
    const s = (styleFn && styleFn(f)) || {};
    const p = g.append('path')
      .attr('d', path(f))
      .attr('fill', s.fill || COLORS.land)
      .attr('stroke', s.stroke || COLORS.border)
      .attr('stroke-width', s.strokeWidth || 0.6);
    if (s.glow) p.style('filter', `drop-shadow(0 0 7px ${s.glow})`);
    if (s.dash) p.attr('stroke-dasharray', s.dash);
  }
  return { projection, svg, features };
}

function badgeHtml(srcKey, covered, rank) {
  const m = SOURCE_META[srcKey];
  if (covered) {
    return `<span class="badge" style="background:${m.color};color:${srcKey === 'NYT' ? '#111827' : '#fff'}"
      title="${m.name}${rank ? ' · rank #' + rank : ''}">${m.letter}</span>`;
  }
  return `<span class="badge badge--off" title="${m.name}: not in top 3">${m.letter}</span>`;
}

function badgesRow(coveredBy) {
  return SOURCE_ORDER.map(s => badgeHtml(s, coveredBy.includes(s))).join('');
}

function logoHtml() {
  return `<div class="logo-box">
    <div class="logo-mark">N</div>
    <span class="logo-text">NewsChart</span>
  </div>`;
}

function radio(label, selected, swatch) {
  return `<label class="radio-row">
    <span class="radio-dot ${selected ? 'radio-dot--on' : ''}"></span>
    ${swatch ? `<span class="src-swatch" style="background:${swatch}"></span>` : ''}
    <span>${label}</span>
  </label>`;
}

function controlPanelHtml(sections) {
  return `<div class="control-panel">
    ${sections.map(rows => `<div class="control-section">${rows.join('')}</div>`).join('')}
  </div>`;
}

function timelineHtml() {
  const dots = [];
  const groups = [[60, 26], [760, 16], [1210, 20]]; // [startX, count] gaps mimic missing days
  for (const [start, count] of groups) {
    for (let i = 0; i < count; i++) dots.push(start + i * 25);
  }
  const last = dots[dots.length - 1];
  return `<div class="timeline">
    <div class="tl-btn">‹</div>
    ${dots.map(x => `<span class="tl-dot ${x === last ? 'tl-dot--active' : ''}" style="left:${x}px"></span>`).join('')}
    <span class="tl-today" style="left:${last - 14}px">Today</span>
    <div class="tl-btn tl-btn--right">›</div>
  </div>`;
}

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${COLORS.bg};
         font-family: 'Segoe UI', 'Ubuntu', 'Helvetica Neue', Arial, sans-serif; position: relative; }
  #map { position: absolute; inset: 0; }

  .logo-box { position: absolute; top: 10px; left: 10px; display: flex; align-items: center; gap: 12px;
    background: ${COLORS.panelBg}; border: 1px solid rgba(96,165,250,0.25); border-radius: 10px;
    padding: 10px 22px 10px 14px; z-index: 30; }
  .logo-mark { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle at 35% 30%, #34d399 0%, #10b981 35%, #1d4ed8 100%);
    color: #fff; font-weight: 800; font-size: 20px; font-family: Georgia, serif; }
  .logo-text { color: #f1f5f9; font-size: 24px; font-weight: 700; letter-spacing: 0.2px; }

  .control-panel { position: absolute; top: 10px; right: 10px; width: 168px; background: ${COLORS.panelBg};
    border: 1px solid rgba(96,165,250,0.25); border-radius: 10px; padding: 10px 12px; z-index: 30; }
  .control-section { padding: 6px 0; }
  .control-section + .control-section { border-top: 1px solid rgba(148,163,184,0.18); }
  .control-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b;
    margin: 2px 0 5px; font-weight: 700; }
  .radio-row { display: flex; align-items: center; gap: 7px; color: #cbd5e1; font-size: 12px; padding: 2.5px 0; }
  .radio-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #cbd5e1; flex: none; }
  .radio-dot--on { border-color: ${COLORS.purple}; background: radial-gradient(circle, ${COLORS.purple} 0 45%, transparent 50%); }
  .src-swatch { width: 8px; height: 8px; border-radius: 50%; flex: none; }

  .badge { display: inline-flex; align-items: center; justify-content: center; width: 19px; height: 19px;
    border-radius: 50%; font-size: 10.5px; font-weight: 800; flex: none; }
  .badge--off { background: transparent; border: 1.5px solid rgba(148,163,184,0.4); color: rgba(148,163,184,0.45); }

  .timeline { position: absolute; left: 85px; right: 85px; bottom: 12px; height: 38px;
    background: ${COLORS.panelBg}; border: 1px solid rgba(96,165,250,0.18); border-radius: 8px; z-index: 25; }
  .tl-dot { position: absolute; top: 16px; width: 7px; height: 7px; border-radius: 50%;
    border: 1.5px solid #cbd5e1; }
  .tl-dot--active { background: #a78bfa; border-color: #a78bfa; transform: scale(1.5); }
  .tl-today { position: absolute; top: 1px; color: #e2e8f0; font-size: 10px; font-weight: 600; }
  .tl-btn { position: absolute; left: 8px; top: 7px; width: 24px; height: 24px; border-radius: 6px;
    background: rgba(96,165,250,0.12); color: #93c5fd; display: flex; align-items: center;
    justify-content: center; font-size: 15px; }
  .tl-btn--right { left: auto; right: 8px; }
`;

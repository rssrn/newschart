import { useEffect, useState } from 'react';
import { feature } from 'topojson-client';
import type { FeatureCollection, Feature } from 'geojson';

const TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
let cache: Feature[] | null = null;
let inflight: Promise<Feature[]> | null = null;

// @author Claude Opus 4.8 Anthropic
export function useWorldCountries(): Feature[] {
  const [features, setFeatures] = useState<Feature[]>(cache ?? []);
  useEffect(() => {
    if (cache) return;
    if (!inflight) {
      inflight = fetch(TOPO_URL)
        .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
        .then(topo => {
          const obj = topo.objects[Object.keys(topo.objects)[0]];
          cache = (feature(topo, obj) as unknown as FeatureCollection).features;
          return cache;
        })
        .catch(err => {
          console.warn('useWorldCountries: failed to load topojson', err);
          inflight = null;
          return [];
        });
    }
    let active = true;
    inflight.then(f => active && setFeatures(f));
    return () => { active = false; };
  }, []);
  return features;
}

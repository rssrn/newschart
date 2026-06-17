import { StoryCallout } from '../types/news';
import { SOURCE_ORDER } from './sources';
import type { CalloutSource } from './sources';

export interface ConsensusGroup {
  country: StoryCallout['country'];
  callouts: StoryCallout[];
  sourcesFiled: string[];
  consensusCount: number;
}

export function groupByCountry(callouts: StoryCallout[]): ConsensusGroup[] {
  const map = new Map<string, ConsensusGroup>();
  for (const c of callouts) {
    const key = c.country.iso2;
    if (!map.has(key)) {
      map.set(key, { country: c.country, callouts: [], sourcesFiled: [], consensusCount: 0 });
    }
    const group = map.get(key)!;
    group.callouts.push(c);
    if (c.source && !group.sourcesFiled.includes(c.source)) {
      group.sourcesFiled.push(c.source);
    }
  }
  for (const group of map.values()) {
    group.consensusCount = group.sourcesFiled.length;
  }
  return Array.from(map.values());
}

export function fullSizeTier(
  groups: ConsensusGroup[],
  cap: number = 4
): ConsensusGroup[] {
  const filtered = groups.filter(g => g.consensusCount >= 2);
  filtered.sort((a, b) => {
    const diff = b.consensusCount - a.consensusCount;
    if (diff !== 0) return diff;
    return a.country.iso2.localeCompare(b.country.iso2);
  });
  return filtered.slice(0, cap);
}

export function chipTier(
  groups: ConsensusGroup[],
  fullSizeGroups: ConsensusGroup[]
): ConsensusGroup[] {
  const tierCodes = new Set(fullSizeGroups.map(g => g.country.iso2));
  return groups.filter(g => !tierCodes.has(g.country.iso2));
}

export function pickDisplayCallout(group: ConsensusGroup): StoryCallout {
  for (const source of SOURCE_ORDER) {
    const found = group.callouts.find(c => c.source === source);
    if (found) return found;
  }
  return group.callouts[0];
}

export interface HighlightedDisplay {
  callout: StoryCallout;
  voiceSource: CalloutSource;
  highlightFiled: boolean;
}

/**
 * A consensus callout prepared for rendering: the display callout plus the
 * resolved highlight state (whose voice is shown, and whether the highlighted
 * source filed here). Carried through layout so the renderer can grey/emphasise
 * and label without re-deriving from the group.
 */
export interface ConsensusRenderCallout extends StoryCallout {
  voiceSource?: CalloutSource;
  highlightFiled?: boolean;
}

export function resolveDisplay(
  group: ConsensusGroup,
  highlight: CalloutSource | null
): HighlightedDisplay {
  if (highlight === null) {
    const callout = pickDisplayCallout(group);
    return { callout, voiceSource: callout.source as CalloutSource, highlightFiled: true };
  }
  const highlighted = group.callouts.find(c => c.source === highlight);
  if (highlighted) {
    return { callout: highlighted, voiceSource: highlight, highlightFiled: true };
  }
  const fallback = pickDisplayCallout(group);
  return { callout: fallback, voiceSource: fallback.source as CalloutSource, highlightFiled: false };
}

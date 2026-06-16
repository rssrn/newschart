export type ViewMode = 'day' | 'heatmap' | 'consensus';

export const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'consensus', label: 'Consensus' },
  { value: 'day', label: 'By Source' },
  { value: 'heatmap', label: 'Coverage Map' },
];

export const NAV = {
  HOME: 'Home',
  HOW_IT_WORKS: 'How it works',
  CREDITS: 'Credits',
  ACCESSIBILITY: 'Accessibility',
  GITHUB: 'GitHub',
  CONTACT: 'Contact',
} as const;

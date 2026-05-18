export type ViewMode = 'day' | 'heatmap';

export const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'day', label: 'Day View' },
  { value: 'heatmap', label: 'Coverage Map' },
];

export const NAV = {
  HOW_IT_WORKS: 'How it works',
  CREDITS: 'Credits',
  GITHUB: 'GitHub',
} as const;

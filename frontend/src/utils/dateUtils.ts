export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export function isToday(iso: string): boolean {
  return iso === todayIso();
}

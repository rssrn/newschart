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

export function nearestAvailableDate(target: string, days: string[]): string {
  if (days.length === 0) return target;
  if (days.includes(target)) return target;
  const targetTime = new Date(target).getTime();
  let best = days[0];
  let bestDist = Math.abs(new Date(days[0]).getTime() - targetTime);
  for (let i = 1; i < days.length; i++) {
    const dist = Math.abs(new Date(days[i]).getTime() - targetTime);
    if (dist < bestDist || (dist === bestDist && days[i] > best)) {
      best = days[i];
      bestDist = dist;
    }
  }
  return best;
}

/**
 * Heat score: how fast a trend is growing, weighted towards fresh items.
 * Input is two snapshots of the same item. Returns 0..100.
 * Pure function so it can be tested without a database.
 */
export function heatScore(input: {
  previousViews: number | null;
  currentViews: number | null;
  hoursBetween: number;
  hoursSinceFirstSeen: number;
}): number {
  const { previousViews, currentViews, hoursBetween, hoursSinceFirstSeen } = input;
  if (currentViews === null || hoursBetween <= 0) return 0;
  const gained = Math.max(0, currentViews - (previousViews ?? 0));
  const perHour = gained / hoursBetween;
  // Newer items get a boost; a 3-day-old item keeps about 1/3 of its weight.
  const freshness = 1 / (1 + hoursSinceFirstSeen / 72);
  const raw = Math.log10(1 + perHour) * 25 * freshness;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** Items at or above this score show the "đang nóng" badge. */
export const HOT_THRESHOLD = 60;

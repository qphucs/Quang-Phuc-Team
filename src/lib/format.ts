/** Display formats — docs/02-design-system.md §8. Always store UTC, display GMT+7. */
import { differenceInCalendarDays, formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { startOfDay } from "date-fns";

export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** 21/11/2026 */
export const formatDate = (date: Date | string) => formatInTimeZone(date, APP_TIME_ZONE, "dd/MM/yyyy");

/** 14:30 */
export const formatTime = (date: Date | string) => formatInTimeZone(date, APP_TIME_ZONE, "HH:mm");

/** 21/11/2026 14:30 */
export const formatDateTime = (date: Date | string) => formatInTimeZone(date, APP_TIME_ZONE, "dd/MM/yyyy HH:mm");

/** "Vừa xong", "5 phút trước", "Hôm qua", or a date for anything older than a week. */
export function formatRelative(date: Date | string, now: Date = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = (now.getTime() - d.getTime()) / 1000;
  if (seconds < 60) return "Vừa xong";
  const days = differenceInCalendarDays(now, d);
  if (days === 1) return "Hôm qua";
  if (days > 7) return formatDate(d);
  return `${formatDistanceToNowStrict(d, { locale: vi })} trước`;
}

const thousands = new Intl.NumberFormat("vi-VN");

/** 12.500 */
export const formatNumber = (n: number) => thousands.format(n);

/** 1,2K · 3,4M · 1,1B */
export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  const units: [number, string][] = [
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const value = Math.floor((n / size) * 10) / 10;
      return `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}${suffix}`;
    }
  }
  return thousands.format(n);
}

/** Start of "today" in Vietnam time, as a UTC instant. Used for "hôm nay" filters. */
export function startOfTodayInVietnam(now: Date = new Date()): Date {
  return fromZonedTime(startOfDay(toZonedTime(now, APP_TIME_ZONE)), APP_TIME_ZONE);
}

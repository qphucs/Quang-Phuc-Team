import "server-only";
import { and, count, eq, gte } from "drizzle-orm";
import { startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { db } from "@/db";
import { downloads, settings } from "@/db/schema";
import { APP_TIME_ZONE } from "@/lib/format";

export const DEFAULT_DAILY_LIMIT = 50;
export const DAILY_LIMIT_KEY = "download_daily_limit";

/** Limit comes from the settings table (owner can change it later); falls back to 50. */
export async function getDailyLimit(): Promise<number> {
  const [row] = await db.select().from(settings).where(eq(settings.key, DAILY_LIMIT_KEY)).limit(1);
  const value = row?.value;
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : DEFAULT_DAILY_LIMIT;
}

/** Start of "today" in Vietnam time, expressed as a UTC instant. */
export function startOfTodayInVietnam(now: Date = new Date()): Date {
  return fromZonedTime(startOfDay(toZonedTime(now, APP_TIME_ZONE)), APP_TIME_ZONE);
}

/** Successful downloads made by this user today. Failed attempts do not use up the quota. */
export async function countTodayForUser(userId: string, now: Date = new Date()): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(downloads)
    .where(
      and(
        eq(downloads.userId, userId),
        eq(downloads.status, "ok"),
        gte(downloads.createdAt, startOfTodayInVietnam(now)),
      ),
    );
  return row?.value ?? 0;
}

export async function getQuota(userId: string) {
  const [limit, used] = await Promise.all([getDailyLimit(), countTodayForUser(userId)]);
  return { used, limit, remaining: Math.max(0, limit - used) };
}

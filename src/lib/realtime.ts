import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { EVENT_CHANNEL, type EventType } from "@/lib/realtime-events";

/** Sends an event to every open /api/events stream. Payloads carry ids only, never sensitive data. */
export async function emit(type: EventType, payload: Record<string, string> = {}) {
  const body = JSON.stringify({ type, payload });
  await db.execute(sql`select pg_notify(${EVENT_CHANNEL}, ${body})`);
}

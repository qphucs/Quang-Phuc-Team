import "server-only";
import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { emit } from "@/lib/realtime";

/**
 * Sends one notification to every active member (not banned, not removed, not the owner's own actor if given).
 * Team is small (~100), so one batch insert is fine.
 */
export async function notifyActiveMembers(entry: {
  type: string;
  title: string;
  body?: string;
  link?: string;
  exceptUserId?: string | null;
}) {
  const recipients = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        isNull(users.deletedAt),
        eq(users.banned, false),
        eq(users.status, "active"),
        entry.exceptUserId ? ne(users.id, entry.exceptUserId) : undefined,
      ),
    );
  if (recipients.length === 0) return 0;

  await db.insert(notifications).values(
    recipients.map((r) => ({
      userId: r.id,
      type: entry.type,
      title: entry.title,
      body: entry.body ?? "",
      link: entry.link ?? null,
    })),
  );
  await emit("notification.created", {});
  return recipients.length;
}

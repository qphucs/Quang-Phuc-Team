import "server-only";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export { AUDIT_LABELS } from "@/lib/audit-labels";

export async function writeAudit(entry: {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    actorId: entry.actorId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    meta: entry.meta ?? {},
  });
}

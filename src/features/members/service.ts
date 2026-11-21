import "server-only";
import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, sessions, users, accounts } from "@/db/schema";
import { auth, toSyntheticEmail, type SessionUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { emit } from "@/lib/realtime";
import type { UserRole, UserStatus } from "@/db/schema";
import type { LIST_FILTERS } from "./schemas";

type Target = { id: string; role: UserRole };

/** A member counts as online if they made a request in the last 2 minutes. */
const ONLINE_WINDOW_MS = 2 * 60_000;

/** 🔒 Who can act on whom (docs/01-scope.md §3). Self-actions are checked by callers. */
function assertCanManage(actor: SessionUser, target: Target) {
  if (target.id === actor.id) return;
  if (target.role === "owner") throw new AppError("FORBIDDEN", "Không thể thay đổi tài khoản chủ team.");
  if (target.role === "admin" && actor.role !== "owner") {
    throw new AppError("FORBIDDEN", "Chỉ chủ team mới quản lý được quản trị viên.");
  }
}

async function loadMember(id: string) {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      phone: users.phone,
      image: users.image,
      role: users.role,
      status: users.status,
      banned: users.banned,
      banReason: users.banReason,
      adminNote: users.adminNote,
      joinedAt: users.joinedAt,
      lastSeenAt: users.lastSeenAt,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND");
  return row;
}

function normalizePhone(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return value.trim() === "" ? null : value.trim();
}

export async function createMemberRecord(input: {
  username: string;
  name: string;
  phone?: string;
  role: "member" | "admin";
  actorId: string | null;
}) {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, input.username)).limit(1);
  if (existing) {
    throw new AppError("CONFLICT", "Tên đăng nhập này đã tồn tại.", {
      username: "Tên đăng nhập này đã được dùng.",
    });
  }

  const tempPassword = generateTempPassword();
  const ctx = await auth.$context;
  const created = await ctx.internalAdapter.createUser(
    {
      name: input.name,
      email: toSyntheticEmail(input.username),
      emailVerified: true,
      username: input.username,
      displayUsername: input.username,
      role: input.role,
      phone: normalizePhone(input.phone) ?? null,
      status: "active",
      mustChangePassword: true,
    },
    { method: "admin" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: created.id,
    providerId: "credential",
    accountId: created.id,
    password: await hashPassword(tempPassword),
  });

  await writeAudit({
    actorId: input.actorId,
    action: "member.created",
    targetType: "user",
    targetId: created.id,
    meta: { username: input.username, role: input.role },
  });
  await emit("member.created", { id: created.id });
  return { id: created.id, username: input.username, tempPassword };
}

export async function listMemberRows(input: { q?: string; filter: (typeof LIST_FILTERS)[number] }) {
  const conditions = [isNull(users.deletedAt)];
  if (input.q) {
    const pattern = `%${input.q.replace(/[%_\\]/g, "\\$&")}%`;
    conditions.push(or(ilike(users.name, pattern), ilike(users.username, pattern))!);
  }
  if (input.filter === "banned") conditions.push(eq(users.banned, true));
  else if (input.filter !== "all") conditions.push(eq(users.status, input.filter as UserStatus));

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
      role: users.role,
      status: users.status,
      banned: users.banned,
      joinedAt: users.joinedAt,
      lastSeenAt: users.lastSeenAt,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(users.name, users.createdAt);

  const now = Date.now();
  return rows.map((row) => ({
    ...row,
    isOnline: row.lastSeenAt ? now - new Date(row.lastSeenAt).getTime() < ONLINE_WINDOW_MS : false,
  }));
}

export async function getMemberDetail(id: string) {
  const member = await loadMember(id);
  const channels = await db.query.tiktokChannels.findMany({
    where: (c, { eq: eqOp }) => eqOp(c.userId, id),
    orderBy: (c, { asc }) => [asc(c.createdAt)],
  });
  const history = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .where(and(eq(auditLogs.targetType, "user"), eq(auditLogs.targetId, id)))
    .orderBy(desc(auditLogs.createdAt))
    .limit(20);
  return { member, channels, history };
}

export async function updateMemberRecord(
  actor: SessionUser,
  input: {
    id: string;
    name?: string;
    phone?: string;
    status?: UserStatus;
    adminNote?: string;
    role?: "member" | "admin";
  },
) {
  const target = await loadMember(input.id);
  assertCanManage(actor, target);

  const isSelf = target.id === actor.id;
  if (isSelf && (input.status !== undefined || input.role !== undefined)) {
    throw new AppError("FORBIDDEN", "Không thể tự thay đổi trạng thái hoặc vai trò của bạn.");
  }
  if (input.role !== undefined && actor.role !== "owner") {
    throw new AppError("FORBIDDEN", "Chỉ chủ team mới đổi được vai trò.");
  }

  const patch: Partial<typeof users.$inferInsert> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.phone !== undefined) patch.phone = normalizePhone(input.phone) ?? null;
  if (input.status !== undefined) patch.status = input.status;
  if (input.adminNote !== undefined) patch.adminNote = input.adminNote === "" ? null : input.adminNote;
  if (input.role !== undefined) patch.role = input.role;

  if (Object.keys(patch).length > 0) {
    await db.update(users).set(patch).where(eq(users.id, input.id));
  }
  await writeAudit({
    actorId: actor.id,
    action: "member.updated",
    targetType: "user",
    targetId: input.id,
    meta: { fields: Object.keys(patch) },
  });
  await emit("member.updated", { id: input.id });
  return { id: input.id };
}

export async function setMemberBannedRecord(actor: SessionUser, id: string, banned: boolean) {
  if (id === actor.id) throw new AppError("FORBIDDEN", "Không thể tự khóa tài khoản của bạn.");
  const target = await loadMember(id);
  assertCanManage(actor, target);

  await db
    .update(users)
    .set({ banned, banReason: banned ? "Khóa bởi quản trị viên" : null, banExpires: null })
    .where(eq(users.id, id));
  if (banned) await db.delete(sessions).where(eq(sessions.userId, id));

  await writeAudit({
    actorId: actor.id,
    action: banned ? "member.banned" : "member.unbanned",
    targetType: "user",
    targetId: id,
  });
  await emit("member.updated", { id });
  return { id, banned };
}

export async function resetMemberPasswordRecord(actor: SessionUser, id: string) {
  if (id === actor.id) {
    throw new AppError("FORBIDDEN", "Hãy dùng mục Đổi mật khẩu để đổi mật khẩu của bạn.");
  }
  const target = await loadMember(id);
  assertCanManage(actor, target);

  const tempPassword = generateTempPassword();
  const hash = await hashPassword(tempPassword);
  await db
    .update(accounts)
    .set({ password: hash })
    .where(and(eq(accounts.userId, id), eq(accounts.providerId, "credential")));
  await db.update(users).set({ mustChangePassword: true }).where(eq(users.id, id));
  await db.delete(sessions).where(eq(sessions.userId, id));

  await writeAudit({
    actorId: actor.id,
    action: "member.password_reset",
    targetType: "user",
    targetId: id,
  });
  await emit("member.updated", { id });
  return { id: target.id, username: target.username ?? "", tempPassword };
}

import "server-only";
import { and, asc, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { learningProgress, levels, skills, users } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { emit } from "@/lib/realtime";
import type { LevelInput } from "./schemas";

/** Admin: team matrix of required-skill progress per member and level. */
export async function computeMatrix() {
  const levelRows = await db.select().from(levels).orderBy(asc(levels.sortOrder), asc(levels.number));
  const members = await db
    .select({ id: users.id, name: users.name, username: users.username, status: users.status, banned: users.banned })
    .from(users)
    .where(and(isNull(users.deletedAt), ne(users.role, "owner")))
    .orderBy(asc(users.name));
  const required = await db
    .select({ id: skills.id, levelId: skills.levelId })
    .from(skills)
    .where(and(eq(skills.status, "published"), isNull(skills.deletedAt), eq(skills.isRequired, true)));
  const completed = await db
    .select({ userId: learningProgress.userId, skillId: learningProgress.skillId })
    .from(learningProgress)
    .where(eq(learningProgress.status, "completed"));

  const doneByUser = new Map<string, Set<string>>();
  for (const row of completed) {
    if (!doneByUser.has(row.userId)) doneByUser.set(row.userId, new Set());
    doneByUser.get(row.userId)!.add(row.skillId);
  }

  return {
    levels: levelRows.map((l) => ({
      id: l.id,
      number: l.number,
      name: l.name,
      total: required.filter((s) => s.levelId === l.id).length,
    })),
    rows: members.map((m) => {
      const mine = doneByUser.get(m.id) ?? new Set<string>();
      return {
        id: m.id,
        name: m.name,
        username: m.username,
        banned: m.banned,
        cells: levelRows.map((l) => ({
          levelId: l.id,
          done: required.filter((s) => s.levelId === l.id && mine.has(s.id)).length,
        })),
      };
    }),
  };
}

export async function listLevels() {
  return db.select().from(levels).orderBy(asc(levels.sortOrder), asc(levels.number));
}

export async function saveLevel(actorId: string, input: LevelInput & { id?: string }) {
  const values = {
    number: input.number,
    name: input.name,
    description: input.description ?? "",
    sortOrder: input.number,
    updatedAt: new Date(),
  };
  if (input.id) {
    const [clash] = await db
      .select({ id: levels.id })
      .from(levels)
      .where(and(eq(levels.number, input.number), ne(levels.id, input.id)))
      .limit(1);
    if (clash)
      throw new AppError("CONFLICT", `Đã có level số ${input.number}.`, { number: "Số này đã dùng cho level khác." });
    const result = await db.update(levels).set(values).where(eq(levels.id, input.id)).returning({ id: levels.id });
    if (result.length === 0) throw new AppError("NOT_FOUND");
    await writeAudit({ actorId, action: "level.updated", targetType: "level", targetId: input.id });
    await emit("learning.updated", { id: input.id });
    return { id: input.id };
  }
  const [clash] = await db.select({ id: levels.id }).from(levels).where(eq(levels.number, input.number)).limit(1);
  if (clash)
    throw new AppError("CONFLICT", `Đã có level số ${input.number}.`, { number: "Số này đã dùng cho level khác." });
  const [row] = await db.insert(levels).values(values).returning({ id: levels.id });
  await writeAudit({ actorId, action: "level.created", targetType: "level", targetId: row.id });
  await emit("learning.updated", { id: row.id });
  return { id: row.id };
}

export async function deleteLevel(actorId: string, id: string) {
  const result = await db.delete(levels).where(eq(levels.id, id)).returning({ id: levels.id });
  if (result.length === 0) throw new AppError("NOT_FOUND");
  await writeAudit({ actorId, action: "level.deleted", targetType: "level", targetId: id });
  await emit("learning.updated", { id });
  return { id };
}

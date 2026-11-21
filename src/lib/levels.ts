import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { learningProgress, levels, skills } from "@/db/schema";
import { AppError } from "@/lib/errors";

export type LevelStatus = {
  id: string;
  number: number;
  name: string;
  description: string;
  requiredTotal: number;
  requiredDone: number;
  unlocked: boolean;
  complete: boolean;
};

/**
 * Level rule (docs/01-scope.md): Level N+1 opens when every required skill in Level N is completed.
 * Levels without required skills count as complete. Level 1 is always open.
 * Shared by the learning feature and the skill feature, so it lives in lib/.
 */
export async function computeLevelStatus(
  userId: string,
): Promise<{ levels: LevelStatus[]; currentLevelId: string | null }> {
  const levelRows = await db.select().from(levels).orderBy(asc(levels.sortOrder), asc(levels.number));
  const required = await db
    .select({ id: skills.id, levelId: skills.levelId })
    .from(skills)
    .where(and(eq(skills.status, "published"), isNull(skills.deletedAt), eq(skills.isRequired, true)));
  const done = await db
    .select({ skillId: learningProgress.skillId })
    .from(learningProgress)
    .where(and(eq(learningProgress.userId, userId), eq(learningProgress.status, "completed")));
  const doneIds = new Set(done.map((d) => d.skillId));

  const result: LevelStatus[] = [];
  let previousComplete = true;
  for (const level of levelRows) {
    const inLevel = required.filter((s) => s.levelId === level.id);
    const requiredDone = inLevel.filter((s) => doneIds.has(s.id)).length;
    const complete = requiredDone === inLevel.length;
    result.push({
      id: level.id,
      number: level.number,
      name: level.name,
      description: level.description,
      requiredTotal: inLevel.length,
      requiredDone,
      unlocked: previousComplete,
      complete,
    });
    previousComplete = previousComplete && complete;
  }

  // Current level = first unlocked level that is not complete; if everything is done, the last level.
  const current = result.find((l) => l.unlocked && !l.complete) ?? result[result.length - 1] ?? null;
  return { levels: result, currentLevelId: current?.id ?? null };
}

/** Server-side guard for opening a single skill (the UI hides locked skills too). */
export async function assertSkillUnlocked(userId: string, levelId: string | null) {
  if (!levelId) return;
  const { levels: all } = await computeLevelStatus(userId);
  const level = all.find((l) => l.id === levelId);
  if (level && !level.unlocked) {
    throw new AppError("FORBIDDEN", "Bài này thuộc level chưa mở. Hãy hoàn thành các bài bắt buộc ở level trước.");
  }
}

"use server";
import { z } from "zod";
import { action } from "@/lib/action";
import { computeMatrix, deleteLevel, listLevels, saveLevel } from "./service";
import { levelIdSchema, levelSchema } from "./schemas";

export const listAllLevels = action({
  schema: z.object({}),
  permission: "skill:read",
  handler: () => listLevels(),
});

export const saveLevelAction = action({
  schema: levelSchema,
  permission: "skill:write",
  handler: (input, { user }) => saveLevel(user.id, input),
});

export const deleteLevelAction = action({
  schema: levelIdSchema,
  permission: "skill:write",
  handler: (input, { user }) => deleteLevel(user.id, input.id),
});

export const getLearningMatrix = action({
  schema: z.object({}),
  permission: "learning:view_all",
  handler: () => computeMatrix(),
});

"use server";
import { z } from "zod";
import { action } from "@/lib/action";
import {
  deleteSkill,
  getPublishedSkillBySlug,
  getSkillForEditor,
  listMyLearning,
  listPublishedSkills,
  listSkillsForAdmin,
  saveSkill,
  setCompleted,
  setSkillPublished,
  toggleSaved,
} from "./service";
import {
  markCompleteSchema,
  memberListSchema,
  skillIdSchema,
  skillInputSchema,
  skillPublishSchema,
  toggleSaveSchema,
} from "./schemas";

/* ----- Admin (skill:write) ----- */

export const saveSkillAction = action({
  schema: skillInputSchema,
  permission: "skill:write",
  handler: (input, { user }) => saveSkill(user, input),
});

export const publishSkillAction = action({
  schema: skillPublishSchema,
  permission: "skill:write",
  handler: (input, { user }) => setSkillPublished(user, input.id, input.publish),
});

export const deleteSkillAction = action({
  schema: skillIdSchema,
  permission: "skill:write",
  handler: (input, { user }) => deleteSkill(user, input.id),
});

export const getSkillEditorAction = action({
  schema: skillIdSchema,
  permission: "skill:write",
  handler: (input) => getSkillForEditor(input.id),
});

export const listAdminSkillsAction = action({
  schema: z.object({}),
  permission: "skill:write",
  handler: () => listSkillsForAdmin(),
});

/* ----- Members (skill:read) ----- */

export const listSkillsAction = action({
  schema: memberListSchema,
  permission: "skill:read",
  handler: (input) => listPublishedSkills(input),
});

export const getSkillAction = action({
  schema: z.object({ slug: z.string().min(1).max(120) }),
  permission: "skill:read",
  handler: (input, { user }) => getPublishedSkillBySlug(input.slug, user.id),
});

export const toggleSavedAction = action({
  schema: toggleSaveSchema,
  permission: "learning:use",
  handler: (input, { user }) => toggleSaved(user.id, input.skillId),
});

export const markCompleteAction = action({
  schema: markCompleteSchema,
  permission: "learning:use",
  handler: (input, { user }) => setCompleted(user.id, input.skillId, input.completed),
});

export const listMyLearningAction = action({
  schema: z.object({}),
  permission: "learning:use",
  handler: (_input, { user }) => listMyLearning(user.id),
});

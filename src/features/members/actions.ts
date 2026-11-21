"use server";
import { action } from "@/lib/action";
import { AppError } from "@/lib/errors";
import {
  createMemberRecord,
  getMemberDetail,
  listMemberRows,
  resetMemberPasswordRecord,
  setMemberBannedRecord,
  updateMemberRecord,
} from "./service";
import { createMemberSchema, listMembersSchema, memberIdSchema, setBannedSchema, updateMemberSchema } from "./schemas";

export const createMember = action({
  schema: createMemberSchema,
  permission: "member:manage",
  handler: async (input, { user }) => {
    if (input.role === "admin" && user.role !== "owner") {
      throw new AppError("FORBIDDEN", "Chỉ chủ team mới tạo được quản trị viên.");
    }
    return createMemberRecord({ ...input, actorId: user.id });
  },
});

export const listMembers = action({
  schema: listMembersSchema,
  permission: "member:manage",
  handler: (input) => listMemberRows(input),
});

export const getMember = action({
  schema: memberIdSchema,
  permission: "member:manage",
  handler: (input) => getMemberDetail(input.id),
});

export const updateMember = action({
  schema: updateMemberSchema,
  permission: "member:manage",
  handler: ({ id, ...patch }, { user }) => updateMemberRecord(user, { id, ...patch }),
});

export const setMemberBanned = action({
  schema: setBannedSchema,
  permission: "member:manage",
  handler: (input, { user }) => setMemberBannedRecord(user, input.id, input.banned),
});

export const resetMemberPassword = action({
  schema: memberIdSchema,
  permission: "member:manage",
  handler: (input, { user }) => resetMemberPasswordRecord(user, input.id),
});

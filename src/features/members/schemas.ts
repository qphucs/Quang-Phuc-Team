import { z } from "zod";

export const MEMBER_STATUSES = ["active", "paused", "left"] as const;
export const LIST_FILTERS = ["all", "active", "paused", "left", "banned"] as const;

const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Tên đăng nhập có ít nhất 3 ký tự.")
  .max(32, "Tên đăng nhập tối đa 32 ký tự.")
  .regex(/^[a-z0-9._]+$/, "Chỉ dùng chữ không dấu, số, dấu chấm hoặc gạch dưới.");

const phone = z
  .string()
  .trim()
  .max(20, "Số điện thoại quá dài.")
  .regex(/^[0-9+\s.-]*$/, "Số điện thoại chỉ gồm số.")
  .optional();

export const createMemberSchema = z.object({
  username,
  name: z.string().trim().min(1, "Hãy nhập họ tên.").max(80, "Họ tên tối đa 80 ký tự."),
  phone,
  role: z.enum(["member", "admin"]).default("member"),
});
export type CreateMemberInput = z.input<typeof createMemberSchema>;

export const listMembersSchema = z.object({
  q: z.string().trim().max(60).optional(),
  filter: z.enum(LIST_FILTERS).default("all"),
});

export const memberIdSchema = z.object({ id: z.uuid() });

export const updateMemberSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, "Hãy nhập họ tên.").max(80).optional(),
  phone,
  status: z.enum(MEMBER_STATUSES).optional(),
  adminNote: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự.").optional(),
  role: z.enum(["member", "admin"]).optional(),
});
export type UpdateMemberInput = z.input<typeof updateMemberSchema>;

export const setBannedSchema = z.object({ id: z.uuid(), banned: z.boolean() });

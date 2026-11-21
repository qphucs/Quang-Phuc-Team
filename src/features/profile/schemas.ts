import { z } from "zod";

export const updateOwnProfileSchema = z.object({
  name: z.string().trim().min(1, "Hãy nhập họ tên.").max(80, "Họ tên tối đa 80 ký tự."),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\s.-]*$/, "Số điện thoại chỉ gồm số.")
    .optional(),
});

export type UpdateOwnProfileInput = z.input<typeof updateOwnProfileSchema>;

export const addChannelSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^@?[A-Za-z0-9._]{2,24}$/, "Tên kênh chỉ gồm chữ, số, dấu chấm hoặc gạch dưới (2–24 ký tự)."),
});

export const removeChannelSchema = z.object({ id: z.uuid() });

export const setAvatarSchema = z.object({ fileId: z.uuid() });

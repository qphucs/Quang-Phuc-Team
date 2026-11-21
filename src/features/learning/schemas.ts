import { z } from "zod";

export const levelSchema = z.object({
  id: z.uuid().optional(),
  number: z.number().int("Số level phải là số nguyên.").min(1, "Số level từ 1.").max(99, "Số level tối đa 99."),
  name: z.string().trim().min(1, "Hãy đặt tên level.").max(60, "Tên level tối đa 60 ký tự."),
  description: z.string().trim().max(300, "Mô tả tối đa 300 ký tự."),
});
export type LevelInput = z.infer<typeof levelSchema>;

export const levelIdSchema = z.object({ id: z.uuid() });

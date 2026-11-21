import { z } from "zod";

export const signInSchema = z.object({
  username: z.string().trim().min(3, "Tên đăng nhập có ít nhất 3 ký tự.").max(32, "Tên đăng nhập tối đa 32 ký tự."),
  password: z.string().min(1, "Hãy nhập mật khẩu."),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Hãy nhập mật khẩu hiện tại."),
    newPassword: z.string().min(8, "Mật khẩu mới có ít nhất 8 ký tự.").max(128),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu nhập lại không khớp.",
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "Mật khẩu mới phải khác mật khẩu hiện tại.",
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

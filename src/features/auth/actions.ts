"use server";
import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { action } from "@/lib/action";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { changePasswordSchema } from "./schemas";

export const changePassword = action({
  schema: changePasswordSchema,
  handler: async (input, { user }) => {
    try {
      await auth.api.changePassword({
        body: {
          currentPassword: input.currentPassword,
          newPassword: input.newPassword,
          revokeOtherSessions: true,
        },
        headers: await headers(),
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw new AppError("VALIDATION_ERROR", undefined, {
          currentPassword: "Mật khẩu hiện tại không đúng.",
        });
      }
      throw error;
    }
    await db.update(users).set({ mustChangePassword: false }).where(eq(users.id, user.id));
    return { changed: true };
  },
});

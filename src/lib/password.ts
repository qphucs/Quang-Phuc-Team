import "server-only";
import { auth } from "@/lib/auth";

export { generateTempPassword } from "@/lib/temp-password";

export async function hashPassword(password: string): Promise<string> {
  const ctx = await auth.$context;
  return ctx.password.hash(password);
}

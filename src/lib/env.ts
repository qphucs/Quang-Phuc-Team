import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DB_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  STORAGE_DRIVER: z.enum(["local", "r2"]).default("local"),
  TIKTOK_PROVIDER: z.enum(["free", "paid"]).default("free"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;

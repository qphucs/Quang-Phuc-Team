import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, username } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { db } from "@/db";
import { accounts, sessions, users, verifications } from "@/db/schema";
import { env } from "@/lib/env";

export const SYNTHETIC_EMAIL_DOMAIN = "qpteam.local";
export const toSyntheticEmail = (name: string) => `${name.toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: users, session: sessions, account: accounts, verification: verifications },
  }),
  advanced: {
    database: { generateId: "uuid" },
  },
  emailAndPassword: {
    enabled: true,
    // Accounts are created by admins only (docs/01-scope.md).
    disableSignUp: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      phone: { type: "string", required: false, input: false },
      status: { type: "string", required: false, input: false, defaultValue: "active" },
      mustChangePassword: { type: "boolean", required: false, input: false, defaultValue: true },
    },
  },
  rateLimit: {
    enabled: true,
    storage: "memory",
    // ~5 failed sign-ins per 15 minutes (docs/03-conventions.md §10).
    customRules: {
      "/sign-in/username": { window: 15 * 60, max: 5 },
    },
  },
  plugins: [
    username({ minUsernameLength: 3, maxUsernameLength: 32 }),
    // Better Auth's built-in admin endpoints are restricted to the owner.
    // Day-to-day admin work goes through our own Server Actions + lib/permissions.ts.
    admin({
      roles: { owner: adminAc, admin: userAc, member: userAc },
      defaultRole: "member",
      adminRoles: ["owner"],
    }),
    nextCookies(), // must be last
  ],
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = Session["user"];

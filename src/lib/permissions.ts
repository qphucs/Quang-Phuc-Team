/**
 * 🔒 Permission matrix — mirrors docs/01-scope.md §3 exactly.
 * UI uses `can()` to show/hide; the server ALWAYS re-checks via lib/action.ts.
 */
import type { UserRole } from "@/db/schema";

export const PERMISSIONS = [
  "skill:read",
  "skill:write",
  "trend:read",
  "trend:approve",
  "download:use",
  "download:view_all",
  "learning:use",
  "learning:view_all",
  "profile:edit_own",
  "member:manage",
  "admin:manage",
  "system:settings",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MEMBER: Permission[] = ["skill:read", "trend:read", "download:use", "learning:use", "profile:edit_own"];

const ADMIN: Permission[] = [
  ...MEMBER,
  "skill:write",
  "trend:approve",
  "download:view_all",
  "learning:view_all",
  "member:manage",
];

const OWNER: Permission[] = [...ADMIN, "admin:manage", "system:settings"];

export const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  owner: new Set(OWNER),
  admin: new Set(ADMIN),
  member: new Set(MEMBER),
};

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Chủ team",
  admin: "Quản trị",
  member: "Thành viên",
};

export function isRole(value: unknown): value is UserRole {
  return value === "owner" || value === "admin" || value === "member";
}

export function can(user: { role?: string | null } | null | undefined, permission: Permission): boolean {
  if (!user || !isRole(user.role)) return false;
  return ROLE_PERMISSIONS[user.role].has(permission);
}

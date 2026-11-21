import "server-only";
import type { ReactNode } from "react";
import { can, isRole, ROLE_LABELS, type Permission } from "@/lib/permissions";
import { requirePermission, requireUser } from "@/lib/session";
import { AppShell } from "./app-shell";

/** Server wrapper: verifies the session (and optional permission), then renders the app shell. */
export async function SignedInShell({ permission, children }: { permission?: Permission; children: ReactNode }) {
  const user = permission ? await requirePermission(permission) : await requireUser();
  const roleLabel = isRole(user.role) ? ROLE_LABELS[user.role] : "";
  return (
    <AppShell user={{ name: user.name, image: user.image, roleLabel }} isAdmin={can(user, "member:manage")}>
      {children}
    </AppShell>
  );
}

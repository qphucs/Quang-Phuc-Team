import type { Metadata } from "next";
import { AdminSkillList } from "@/features/skills/components/admin-skill-list";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Bài học" };

export default async function AdminSkillsPage() {
  await requirePermission("skill:write");
  return <AdminSkillList />;
}

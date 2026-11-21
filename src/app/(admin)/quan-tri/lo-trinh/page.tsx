import type { Metadata } from "next";
import { LevelsManager } from "@/features/learning/components/levels-manager";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Lộ trình" };

export default async function LevelsPage() {
  await requirePermission("skill:write");
  return <LevelsManager />;
}

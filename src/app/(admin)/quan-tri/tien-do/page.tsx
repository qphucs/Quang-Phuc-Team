import type { Metadata } from "next";
import { ProgressMatrix } from "@/features/learning/components/progress-matrix";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Tiến độ học" };

export default async function ProgressPage() {
  await requirePermission("learning:view_all");
  return <ProgressMatrix />;
}

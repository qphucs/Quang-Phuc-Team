import type { Metadata } from "next";
import { TrendQueue } from "@/features/trends/components/trend-queue";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Duyệt trend" };

export default async function TrendAdminPage() {
  await requirePermission("trend:approve");
  return <TrendQueue />;
}

import type { Metadata } from "next";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Tổng quan" };

export default async function AdminHomePage() {
  await requirePermission("member:manage");
  return <DashboardView />;
}

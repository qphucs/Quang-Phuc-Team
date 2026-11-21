import type { Metadata } from "next";
import { OwnerSettings } from "@/features/settings/components/owner-settings";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  await requirePermission("system:settings");
  return <OwnerSettings />;
}

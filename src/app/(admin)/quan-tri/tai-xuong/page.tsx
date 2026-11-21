import type { Metadata } from "next";
import { DownloadLog } from "@/features/downloader/components/download-log";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Nhật ký tải" };

export default async function DownloadLogPage() {
  await requirePermission("download:view_all");
  return <DownloadLog />;
}

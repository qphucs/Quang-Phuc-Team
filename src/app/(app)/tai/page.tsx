import { Download } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Tải TikTok" };

export default function DownloadPage() {
  return (
    <ComingSoon title="Tải TikTok" description="Tải video, ảnh và nhạc TikTok không logo." icon={Download} sprint={2} />
  );
}

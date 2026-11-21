import type { Metadata } from "next";
import { Downloader } from "@/features/downloader/components/downloader";

export const metadata: Metadata = { title: "Tải TikTok" };

export default function DownloadPage() {
  return <Downloader />;
}

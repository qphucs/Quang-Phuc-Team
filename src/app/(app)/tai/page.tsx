import type { Metadata } from "next";
import { Downloader } from "@/features/downloader/components/downloader";

export const metadata: Metadata = { title: "Tải TikTok" };

export default async function DownloadPage({ searchParams }: PageProps<"/tai">) {
  const { url } = await searchParams;
  return <Downloader initialUrl={typeof url === "string" ? url : ""} />;
}

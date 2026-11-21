import { TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Trend" };

export default function TrendPage() {
  return (
    <ComingSoon
      title="Trend"
      description="Trend edit CapCut và nhạc TikTok cập nhật mỗi ngày."
      icon={TrendingUp}
      sprint={5}
    />
  );
}

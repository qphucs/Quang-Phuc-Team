import type { Metadata } from "next";
import { TrendFeed } from "@/features/trends/components/trend-feed";

export const metadata: Metadata = { title: "Trend" };

export default function TrendPage() {
  return <TrendFeed />;
}

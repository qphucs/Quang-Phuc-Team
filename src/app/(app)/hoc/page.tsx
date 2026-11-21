import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Học" };

export default function LearnPage() {
  return <ComingSoon title="Học" description="Thư viện skill và lộ trình Level 1 → 3." icon={BookOpen} sprint={3} />;
}

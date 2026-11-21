import { Users } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Quản trị" };

export default function AdminHomePage() {
  return (
    <ComingSoon
      title="Quản trị"
      description="Quản lý thành viên, skill, trend và nhật ký hoạt động."
      icon={Users}
      sprint={1}
    />
  );
}

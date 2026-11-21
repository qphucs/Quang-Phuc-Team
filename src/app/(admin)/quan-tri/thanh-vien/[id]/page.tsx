import type { Metadata } from "next";
import { MemberDetail } from "@/features/members/components/member-detail";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Chi tiết thành viên" };

export default async function MemberPage({ params }: PageProps<"/quan-tri/thanh-vien/[id]">) {
  const { id } = await params;
  const me = await requirePermission("member:manage");
  return <MemberDetail id={id} viewerId={me.id} viewerIsOwner={me.role === "owner"} />;
}

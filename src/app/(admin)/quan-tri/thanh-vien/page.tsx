import type { Metadata } from "next";
import { MembersList } from "@/features/members/components/members-list";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Thành viên" };

export default async function MembersPage() {
  const me = await requirePermission("member:manage");
  return <MembersList isOwner={me.role === "owner"} />;
}

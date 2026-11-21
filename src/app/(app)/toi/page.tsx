import { KeyRound, LayoutDashboard, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { MyChannels } from "@/features/profile/components/my-channels";
import { ProfileCard } from "@/features/profile/components/profile-card";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { COPY } from "@/lib/copy";
import { can, isRole, ROLE_LABELS } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Tôi" };

const rowClass = "flex h-14 items-center gap-3 px-4 text-ink active:bg-surface";

export default async function MePage() {
  const user = await requireUser();
  const roleLabel = isRole(user.role) ? ROLE_LABELS[user.role] : "";
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Tôi" />
      <ProfileCard
        name={user.name}
        username={user.username ?? ""}
        phone={user.phone ?? null}
        image={user.image ?? null}
        roleLabel={roleLabel}
        joinedAt={user.createdAt}
      />

      <MyChannels />

      <Card className="divide-y divide-line p-0">
        <Link href="/doi-mat-khau" className={rowClass}>
          <KeyRound className="size-5 text-muted" strokeWidth={1.75} aria-hidden />
          <span className="flex-1 font-medium">Đổi mật khẩu</span>
          <ChevronRight className="size-5 text-muted" aria-hidden />
        </Link>
        {can(user, "member:manage") ? (
          <Link href="/quan-tri" className={rowClass}>
            <LayoutDashboard className="size-5 text-muted" strokeWidth={1.75} aria-hidden />
            <span className="flex-1 font-medium">{COPY.admin}</span>
            <ChevronRight className="size-5 text-muted" aria-hidden />
          </Link>
        ) : null}
      </Card>

      <SignOutButton className="w-full" />
    </div>
  );
}

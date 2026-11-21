import { ChevronRight, KeyRound, LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { COPY } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { can, isRole, ROLE_LABELS } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Tôi" };

const rowClass = "flex h-14 items-center gap-3 px-4 text-ink active:bg-surface";

export default async function MePage() {
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Tôi" />
      <Card className="flex items-center gap-4">
        <Avatar name={user.name} src={user.image} size={64} />
        <div className="min-w-0">
          <p className="truncate text-h3 font-semibold text-ink">{user.name}</p>
          <p className="truncate text-sm text-muted">@{user.username}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {isRole(user.role) ? <Badge variant="brand">{ROLE_LABELS[user.role]}</Badge> : null}
            <Badge>Tham gia {formatDate(user.createdAt)}</Badge>
          </div>
        </div>
      </Card>

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

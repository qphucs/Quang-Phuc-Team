"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, KeyRound, Lock, LockOpen, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { AUDIT_LABELS } from "@/lib/audit-labels";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import { ROLE_LABELS, isRole } from "@/lib/permissions";
import { unwrap } from "@/lib/result";
import { getMember, resetMemberPassword, setMemberBanned } from "../actions";
import { CredentialsPanel } from "./credentials-panel";
import { EditMemberForm } from "./edit-member-form";

const STATUS_LABEL = { active: "Đang làm", paused: "Tạm nghỉ", left: "Đã nghỉ" } as const;

export function MemberDetail({
  id,
  viewerId,
  viewerIsOwner,
}: {
  id: string;
  viewerId: string;
  viewerIsOwner: boolean;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetResult, setResetResult] = useState<{ username: string; tempPassword: string } | null>(null);

  const query = useQuery({
    queryKey: ["member", id],
    queryFn: async () => unwrap(await getMember({ id })),
  });

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28 w-full rounded-md" />
        <Skeleton className="h-40 w-full rounded-md" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <Card>
        <p role="alert" className="text-sm text-danger-ink">
          {query.error.message}
        </p>
      </Card>
    );
  }

  const { member, channels, history } = query.data;
  const isSelf = member.id === viewerId;
  const isOwnerTarget = member.role === "owner";
  const canManage = !isSelf && !isOwnerTarget && (viewerIsOwner || member.role !== "admin");
  const roleLabel = isRole(member.role) ? ROLE_LABELS[member.role] : "";

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["member", id] });
    void queryClient.invalidateQueries({ queryKey: ["members"] });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex items-center gap-4">
        <Avatar name={member.name} src={member.image} size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-h3 font-semibold text-ink">{member.name}</p>
          <p className="truncate text-sm text-muted">@{member.username}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="brand">{roleLabel}</Badge>
            {member.banned ? (
              <Badge variant="danger">Đã khóa</Badge>
            ) : (
              <Badge variant="success">{STATUS_LABEL[member.status]}</Badge>
            )}
          </div>
        </div>
      </Card>

      {canManage ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil aria-hidden />
            Sửa thông tin
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setResetResult(null);
              setResetOpen(true);
            }}
          >
            <KeyRound aria-hidden />
            Đặt lại mật khẩu
          </Button>
          <Button variant={member.banned ? "secondary" : "danger"} onClick={() => setBanOpen(true)}>
            {member.banned ? <LockOpen aria-hidden /> : <Lock aria-hidden />}
            {member.banned ? "Mở khóa" : "Khóa tài khoản"}
          </Button>
        </div>
      ) : null}

      <Card className="flex flex-col gap-3">
        <h2 className="text-h3 font-semibold text-ink">Thông tin</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Số điện thoại</dt>
          <dd className="text-ink">{member.phone ?? "Chưa có"}</dd>
          <dt className="text-muted">Ngày vào team</dt>
          <dd className="text-ink">{formatDate(member.joinedAt)}</dd>
          <dt className="text-muted">Lần cuối online</dt>
          <dd className="text-ink">{member.lastSeenAt ? formatRelative(member.lastSeenAt) : "Chưa đăng nhập"}</dd>
          <dt className="text-muted">Mật khẩu</dt>
          <dd className="text-ink">{member.mustChangePassword ? "Chưa đổi mật khẩu tạm" : "Đã đổi"}</dd>
        </dl>
        {member.adminNote ? <p className="rounded-sm bg-surface p-3 text-sm text-body">{member.adminNote}</p> : null}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-h3 font-semibold text-ink">Kênh TikTok</h2>
        {channels.length === 0 ? (
          <p className="text-sm text-muted">Chưa có kênh nào.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {channels.map((c) => (
              <li key={c.id}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-between rounded-sm px-3 text-sm font-medium text-brand-ink active:bg-surface"
                >
                  @{c.username}
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-h3 font-semibold text-ink">Lịch sử gần đây</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted">Chưa có hoạt động nào.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {history.map((h) => (
              <li key={h.id} className="flex flex-col py-2">
                <span className="text-sm font-medium text-ink">{AUDIT_LABELS[h.action] ?? h.action}</span>
                <span className="text-caption text-muted">
                  {h.actorName ?? "Hệ thống"} · {formatDateTime(h.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Link href="/quan-tri/thanh-vien" className="text-center text-sm font-medium text-brand-ink">
        ← Về danh sách thành viên
      </Link>

      {canManage ? (
        <>
          <Sheet open={editing} onOpenChange={setEditing} title="Sửa thông tin">
            <EditMemberForm
              member={{ ...member, role: member.role }}
              canChangeRole={viewerIsOwner}
              canChangeStatus
              onDone={() => setEditing(false)}
            />
          </Sheet>

          <ConfirmSheet
            open={banOpen}
            onOpenChange={setBanOpen}
            title={member.banned ? "Mở khóa tài khoản?" : "Khóa tài khoản?"}
            description={
              member.banned
                ? `${member.name} sẽ đăng nhập lại được.`
                : `${member.name} sẽ bị đăng xuất và không đăng nhập được cho đến khi được mở khóa.`
            }
            confirmLabel={member.banned ? "Mở khóa" : "Khóa tài khoản"}
            danger={!member.banned}
            onConfirm={async () => {
              const result = await setMemberBanned({ id, banned: !member.banned });
              if (result.ok) refresh();
              return result.ok ? { ok: true } : { ok: false, message: result.error.message };
            }}
          />

          <Sheet
            open={resetOpen}
            onOpenChange={(next) => {
              setResetOpen(next);
              if (!next) setResetResult(null);
            }}
            title="Đặt lại mật khẩu"
            description={resetResult ? undefined : `Tạo mật khẩu tạm mới cho ${member.name}.`}
          >
            {resetResult ? (
              <div className="flex flex-col gap-4">
                <CredentialsPanel username={resetResult.username} tempPassword={resetResult.tempPassword} />
                <Button size="lg" className="w-full" onClick={() => setResetOpen(false)}>
                  Xong
                </Button>
              </div>
            ) : (
              <ResetPasswordStep
                onConfirm={async () => {
                  const result = await resetMemberPassword({ id });
                  if (!result.ok) return { ok: false as const, message: result.error.message };
                  setResetResult(result.data);
                  refresh();
                  return { ok: true as const };
                }}
                onCancel={() => setResetOpen(false)}
              />
            )}
          </Sheet>
        </>
      ) : null}
    </div>
  );
}

/** Confirm step for the reset sheet. Kept separate so the result step can replace it in the same sheet. */
function ResetPasswordStep({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => Promise<{ ok: true } | { ok: false; message: string }>;
  onCancel: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-body">
        Mật khẩu cũ sẽ không dùng được nữa, và thành viên sẽ bị đăng xuất khỏi mọi thiết bị.
      </p>
      {error ? (
        <p role="alert" className="rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger-ink">
          {error}
        </p>
      ) : null}
      <Button
        variant="danger"
        size="lg"
        loading={pending}
        className="w-full"
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await onConfirm();
          setPending(false);
          if (!result.ok) setError(result.message);
        }}
      >
        Đặt lại mật khẩu
      </Button>
      <Button variant="secondary" size="lg" className="w-full" disabled={pending} onClick={onCancel}>
        Hủy
      </Button>
    </div>
  );
}

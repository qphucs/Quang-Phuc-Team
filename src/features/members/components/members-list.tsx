"use client";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, UserRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { ROLE_LABELS, isRole } from "@/lib/permissions";
import { unwrap } from "@/lib/result";
import { cn } from "@/lib/utils";
import { listMembers } from "../actions";
import { CreateMemberForm } from "./create-member-form";
import type { LIST_FILTERS } from "../schemas";

type Filter = (typeof LIST_FILTERS)[number];

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Đang làm" },
  { value: "paused", label: "Tạm nghỉ" },
  { value: "left", label: "Đã nghỉ" },
  { value: "banned", label: "Đã khóa" },
];

const STATUS_LABEL: Record<string, { label: string; variant: "success" | "warning" | "neutral" }> = {
  active: { label: "Đang làm", variant: "success" },
  paused: { label: "Tạm nghỉ", variant: "warning" },
  left: { label: "Đã nghỉ", variant: "neutral" },
};

export function MembersList({ isOwner }: { isOwner: boolean }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(false);

  const query = useQuery({
    queryKey: ["members", q, filter],
    queryFn: async () => unwrap(await listMembers({ q: q || undefined, filter })),
    // Presence ("online" dot) is computed from lastSeenAt, so refresh it periodically.
    refetchInterval: 60_000,
  });

  const counts = useMemo(() => {
    const rows = query.data ?? [];
    return { total: rows.length };
  }, [query.data]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 font-bold">Thành viên</h1>
          <p className="mt-1 text-sm text-body">{query.data ? `${counts.total} người` : "Đang tải…"}</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus aria-hidden />
          Tạo tài khoản
        </Button>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên hoặc tên đăng nhập"
          aria-label="Tìm thành viên"
          className="pl-10"
        />
      </div>

      <div role="group" aria-label="Lọc theo trạng thái" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.value)}
              className={cn(
                "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
                active ? "border-brand bg-brand-tint text-brand-ink" : "border-line bg-white text-body",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {query.isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-md" />
          ))}
        </div>
      ) : query.isError ? (
        <Card>
          <p role="alert" className="text-sm text-danger-ink">
            {query.error.message}
          </p>
        </Card>
      ) : query.data.length === 0 ? (
        <Card>
          <EmptyState icon={UserRound} text="Chưa có thành viên nào phù hợp." />
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {query.data.map((m) => {
            const online = m.isOnline;
            const status = m.banned
              ? { label: "Đã khóa", variant: "danger" as const }
              : (STATUS_LABEL[m.status] ?? STATUS_LABEL.active);
            return (
              <li key={m.id}>
                <Link
                  href={`/quan-tri/thanh-vien/${m.id}` as Route}
                  className="flex items-center gap-3 rounded-md border border-line bg-white p-3 active:bg-surface lg:hover:bg-surface"
                >
                  <div className="relative">
                    <Avatar name={m.name} src={m.image} size={40} />
                    {online ? (
                      <span
                        className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-white bg-success"
                        role="img"
                        aria-label="Đang online"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
                    <p className="truncate text-caption text-muted">
                      @{m.username} · {m.lastSeenAt ? formatRelative(m.lastSeenAt) : "Chưa đăng nhập"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {isRole(m.role) && m.role !== "member" ? (
                      <span className="text-caption text-muted">{ROLE_LABELS[m.role]}</span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet
        open={creating}
        onOpenChange={setCreating}
        title="Tạo tài khoản"
        description="Admin tạo, thành viên đăng nhập và tự đổi mật khẩu."
      >
        <CreateMemberForm isOwner={isOwner} onDone={() => setCreating(false)} />
      </Sheet>
    </div>
  );
}

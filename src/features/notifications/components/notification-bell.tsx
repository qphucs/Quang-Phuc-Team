"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { unwrap } from "@/lib/result";
import { cn } from "@/lib/utils";
import { listNotificationsAction, markAllReadAction, unreadCountAction } from "../actions";

/** Header bell: unread count, and a sheet with the latest items. Refreshed by realtime events. */
export function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const count = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => unwrap(await unreadCountAction({})),
    refetchInterval: 120_000,
  });
  const list = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async () => unwrap(await listNotificationsAction({})),
    enabled: open,
  });

  const unread = count.data ?? 0;

  return (
    <>
      <button
        type="button"
        className="relative -mr-2 flex size-11 items-center justify-center rounded-full active:bg-surface"
        aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}
        onClick={async () => {
          setOpen(true);
          if (unread > 0) {
            await markAllReadAction({});
            void queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }
        }}
      >
        <Bell className="size-5 text-ink" strokeWidth={1.75} aria-hidden />
        {unread > 0 ? (
          <span className="absolute top-2 right-2 flex min-w-4 items-center justify-center rounded-full bg-danger-ink px-1 text-[10px] leading-4 font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      <Sheet open={open} onOpenChange={setOpen} title="Thông báo">
        {list.isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : list.isError ? (
          <p role="alert" className="text-sm text-danger-ink">
            {list.error.message}
          </p>
        ) : list.data.length === 0 ? (
          <EmptyState icon={Bell} text="Chưa có thông báo nào." />
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {list.data.map((n) => {
              const content = (
                <div className={cn("flex flex-col gap-0.5 py-3", !n.readAt && "font-medium")}>
                  <span className="text-sm text-ink">{n.title}</span>
                  {n.body ? <span className="text-caption text-body">{n.body}</span> : null}
                  <span className="text-caption text-muted">{formatRelative(n.createdAt)}</span>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link href={n.link as Route} onClick={() => setOpen(false)} className="block active:bg-surface">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>
    </>
  );
}

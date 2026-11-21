"use client";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { unwrap } from "@/lib/result";
import { getAllDownloads } from "../actions";
import { KIND_LABEL, type DownloadKindLabel } from "../types";

/** Team-wide download log for admins (docs/04-architecture.md §5). Refreshes every minute. */
export function DownloadLog() {
  const query = useQuery({
    queryKey: ["download-log"],
    queryFn: async () => unwrap(await getAllDownloads({})),
    refetchInterval: 60_000,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1 font-bold">Nhật ký tải</h1>
        <p className="mt-1 text-sm text-body">100 lượt tải gần nhất của cả team.</p>
      </div>

      {query.isPending ? (
        <Skeleton className="h-64 w-full rounded-md" />
      ) : query.isError ? (
        <Card>
          <p role="alert" className="text-sm text-danger-ink">
            {query.error.message}
          </p>
        </Card>
      ) : query.data.length === 0 ? (
        <Card>
          <EmptyState icon={Download} text="Chưa có lượt tải nào." />
        </Card>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-line">
            {query.data.map((row) => {
              const kind = row.kind as DownloadKindLabel;
              return (
                <li key={row.id} className="flex flex-col gap-1 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-ink">{row.userName}</span>
                    <Badge variant={row.status === "ok" ? "success" : "danger"}>
                      {row.status === "ok" ? KIND_LABEL[kind] : "Lỗi"}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-body">{row.title || row.sourceUrl}</p>
                  <p className="text-caption text-muted">
                    @{row.username} · {formatDateTime(row.createdAt)}
                    {row.error ? ` · ${row.error}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

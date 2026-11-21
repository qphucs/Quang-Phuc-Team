"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, Download, Flame, Music, Pin, TrendingUp, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { HOT_THRESHOLD } from "../heat";
import { listTrendFeedAction, toggleSavedTrendAction } from "../actions";
import { cn } from "@/lib/utils";
import { unwrap } from "@/lib/result";
import { formatRelative } from "@/lib/format";

type Tab = "capcut_edit" | "sound" | "saved";
type Range = "today" | "week";

const TABS: { value: Tab; label: string }[] = [
  { value: "capcut_edit", label: "Edit CapCut" },
  { value: "sound", label: "Nhạc" },
  { value: "saved", label: "Đã lưu" },
];

export function TrendFeed() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("capcut_edit");
  const [range, setRange] = useState<Range>("today");

  const query = useQuery({
    queryKey: ["trends", tab, range],
    queryFn: async () => unwrap(await listTrendFeedAction({ type: tab, range })),
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1 font-bold">Trend</h1>
        <p className="mt-1 text-sm text-body">Trend edit CapCut và nhạc TikTok được đội ngũ chọn lọc mỗi ngày.</p>
      </div>

      <div role="tablist" aria-label="Loại trend" className="grid grid-cols-3 gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "h-11 rounded-sm border text-sm font-semibold transition-colors",
              tab === t.value ? "border-brand bg-brand-tint text-brand-ink" : "border-line bg-white text-body",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "saved" ? (
        <div role="group" aria-label="Khoảng thời gian" className="flex gap-2">
          {(
            [
              ["today", "Hôm nay"],
              ["week", "7 ngày"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={range === value}
              onClick={() => setRange(value)}
              className={cn(
                "h-9 rounded-full border px-4 text-sm font-medium",
                range === value ? "border-brand bg-brand-tint text-brand-ink" : "border-line bg-white text-body",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {query.isPending ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-[9/16] w-full rounded-md" />
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
          <EmptyState
            icon={TrendingUp}
            text={tab === "saved" ? "Bạn chưa lưu trend nào." : "Chưa có trend nào trong khoảng thời gian này."}
          />
        </Card>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {query.data.map((t) => (
            <li key={t.id}>
              <Card className="flex h-full flex-col gap-2 p-2.5">
                <div className="relative aspect-[9/16] overflow-hidden rounded-sm border border-line bg-surface">
                  {t.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote TikTok thumbnail
                    <img src={t.coverUrl} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted">
                      {t.type === "sound" ? <Music aria-hidden /> : <TrendingUp aria-hidden />}
                    </div>
                  )}
                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                    {t.isPinned ? (
                      <Badge variant="brand">
                        <Pin aria-hidden /> Ghim
                      </Badge>
                    ) : null}
                    {t.heatScore >= HOT_THRESHOLD ? (
                      <Badge variant="danger">
                        <Flame aria-hidden /> Đang nóng
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <p className="line-clamp-2 text-sm font-semibold text-ink">{t.title || "Không có tiêu đề"}</p>
                <p className="truncate text-caption text-muted">
                  {t.author ? `@${t.author} · ` : ""}
                  {formatRelative(t.firstSeenAt)}
                </p>
                {t.note ? <p className="line-clamp-2 text-caption text-body">{t.note}</p> : null}
                <div className="mt-auto flex flex-col gap-1.5">
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/tai?url=${encodeURIComponent(t.url)}` as Route}>
                      <Download aria-hidden />
                      Tải
                    </Link>
                  </Button>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={t.saved ? "Bỏ lưu" : "Lưu"}
                      onClick={async () => {
                        const result = await toggleSavedTrendAction({ trendId: t.id });
                        if (result.ok) {
                          toast.success(result.data.saved ? "Đã lưu trend." : "Đã bỏ lưu.");
                          await queryClient.invalidateQueries({ queryKey: ["trends"] });
                        } else toast.error(result.error.message);
                      }}
                    >
                      {t.saved ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />}
                    </Button>
                    <Button asChild variant="secondary" size="sm" aria-label="Xem trên TikTok">
                      <a href={t.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink aria-hidden />
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

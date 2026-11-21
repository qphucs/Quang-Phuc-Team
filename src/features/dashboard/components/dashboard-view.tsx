"use client";
import { useQuery } from "@tanstack/react-query";
import { Activity, BookOpen, Download, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { unwrap } from "@/lib/result";
import { getDashboardAction } from "../actions";

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number | string }) {
  return (
    <Card className="flex flex-col gap-2">
      <Icon className="size-5 text-muted" strokeWidth={1.75} aria-hidden />
      <p className="text-h2 font-semibold text-ink tabular-nums">{value}</p>
      <p className="text-caption text-body">{label}</p>
    </Card>
  );
}

export function DashboardView() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => unwrap(await getDashboardAction({})),
    refetchInterval: 60_000,
  });

  if (query.isPending) return <Skeleton className="h-64 w-full rounded-md" />;
  if (query.isError) {
    return (
      <Card>
        <p role="alert" className="text-sm text-danger-ink">
          {query.error.message}
        </p>
      </Card>
    );
  }
  const d = query.data;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1 font-bold">Tổng quan</h1>
        <p className="mt-1 text-sm text-body">Tình hình team hôm nay.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Users} label="Thành viên đang làm" value={d.members} />
        <Stat icon={Activity} label="Đang online" value={d.onlineNow} />
        <Stat icon={TrendingUp} label="Trend chờ duyệt" value={d.pendingTrends} />
        <Stat icon={Download} label="Lượt tải hôm nay" value={d.downloadsToday} />
      </div>
      <Stat icon={BookOpen} label="Bài học đã đăng" value={d.publishedSkills} />
      <Card className="flex flex-col gap-3">
        <h2 className="text-h3 font-semibold text-ink">Hoạt động gần đây</h2>
        {d.activity.length === 0 ? (
          <p className="text-sm text-muted">Chưa có hoạt động nào.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {d.activity.map((a, i) => (
              <li key={i} className="flex flex-col py-2">
                <span className="text-sm text-ink">{a.label}</span>
                <span className="text-caption text-muted">
                  {a.actorName ?? "Hệ thống"} · {formatRelative(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

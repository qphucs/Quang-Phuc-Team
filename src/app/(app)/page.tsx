import { BookOpen, Download, Music2, TrendingUp, type LucideIcon } from "lucide-react";
import type { Route } from "next";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { COPY } from "@/lib/copy";
import { HomeProgress } from "@/features/skills/components/home-progress";
import { listFeed } from "@/features/trends/service";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

type Shortcut = { href: Route; label: string; icon: LucideIcon; tile: string; iconClass: string };

/** Area colors — docs/02-design-system.md §1.2 (flat accent tile + ink icon; downloader = ink tile + white icon). */
const SHORTCUTS: Shortcut[] = [
  { href: "/hoc", label: "Học", icon: BookOpen, tile: "bg-accent-cyan", iconClass: "text-ink" },
  { href: "/trend", label: "Trend CapCut", icon: TrendingUp, tile: "bg-accent-violet", iconClass: "text-ink" },
  { href: "/trend", label: "Trend Nhạc", icon: Music2, tile: "bg-accent-pink", iconClass: "text-ink" },
  { href: "/tai", label: "Tải TikTok", icon: Download, tile: "bg-ink", iconClass: "text-white" },
];

function greeting(date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(date));
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export default async function HomePage() {
  const user = await requireUser();
  const [capcut, sound] = await Promise.all([
    listFeed({ type: "capcut_edit", range: "today" }, user.id),
    listFeed({ type: "sound", range: "today" }, user.id),
  ]);
  const hot = [...capcut, ...sound].sort((a, b) => b.heatScore - a.heatScore).slice(0, 3);
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-md bg-brand-tint p-4">
        <p className="text-sm text-body">{greeting()},</p>
        <h1 className="text-h2 font-semibold">{user.name}</h1>
        <div className="mt-3">
          <HomeProgress />
        </div>
      </section>

      <nav aria-label="Lối tắt" className="grid grid-cols-4 gap-2">
        {SHORTCUTS.map(({ href, label, icon: Icon, tile, iconClass }) => (
          <Link key={label} href={href} className="flex flex-col items-center gap-1.5 text-center">
            <span className={cn("flex size-12 items-center justify-center rounded-md", tile)}>
              <Icon className={cn("size-6", iconClass)} strokeWidth={1.75} aria-hidden />
            </span>
            <span className="text-caption font-medium text-ink">{label}</span>
          </Link>
        ))}
      </nav>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-semibold">Trend nóng hôm nay</h2>
          <Link href="/trend" className="text-sm font-medium text-brand-ink">
            Xem tất cả
          </Link>
        </div>
        {hot.length === 0 ? (
          <Card>
            <EmptyState icon={TrendingUp} text="Hôm nay chưa có trend nào được duyệt." />
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {hot.map((t) => (
              <li key={t.id}>
                <Link
                  href="/trend"
                  className="flex items-center gap-3 rounded-md border border-line bg-white p-3 active:bg-surface"
                >
                  <div className="size-12 shrink-0 overflow-hidden rounded-sm bg-surface">
                    {t.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote TikTok thumbnail
                      <img src={t.coverUrl} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{t.title || "Trend mới"}</p>
                    <p className="text-caption text-muted">{t.type === "sound" ? "Nhạc" : "Edit CapCut"}</p>
                  </div>
                  <Badge variant={t.type === "sound" ? "pink" : "violet"}>
                    {t.type === "sound" ? "Nhạc" : "CapCut"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

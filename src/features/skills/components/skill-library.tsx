"use client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Lock, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { unwrap } from "@/lib/result";
import { cn } from "@/lib/utils";
import { getMyLevels, listMyLearningAction, listSkillsAction } from "../actions";
import { DIFFICULTIES, DIFFICULTY_LABEL } from "../schemas";

type Difficulty = "all" | (typeof DIFFICULTIES)[number];

type Row = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: (typeof DIFFICULTIES)[number];
  durationMin: number;
  coverFileId: string | null;
  levelId: string | null;
};

export function SkillLibrary() {
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("all");

  const skills = useQuery({
    queryKey: ["skills", q, difficulty],
    queryFn: async () => unwrap(await listSkillsAction({ q: q || undefined, difficulty })),
  });
  const learning = useQuery({
    queryKey: ["my-learning"],
    queryFn: async () => unwrap(await listMyLearningAction({})),
  });
  const levels = useQuery({
    queryKey: ["levels-progress"],
    queryFn: async () => unwrap(await getMyLevels({})),
  });

  const progress = useMemo(() => {
    const map = new Map<string, "saved" | "completed">();
    for (const row of learning.data ?? []) map.set(row.skillId, row.status);
    return map;
  }, [learning.data]);

  /** Groups the visible skills under their level, in level order. Unassigned skills go last. */
  const groups = useMemo(() => {
    const rows = (skills.data ?? []) as Row[];
    const order = levels.data?.levels ?? [];
    const result = order
      .map((level) => ({ level, items: rows.filter((r) => r.levelId === level.id) }))
      .filter((g) => g.items.length > 0);
    const loose = rows.filter((r) => !r.levelId || !order.some((l) => l.id === r.levelId));
    if (loose.length > 0) result.push({ level: null as never, items: loose });
    return result;
  }, [skills.data, levels.data]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1 font-bold">Học</h1>
        <p className="mt-1 text-sm text-body">Lộ trình từ Level 1, hoàn thành bài bắt buộc để mở level tiếp theo.</p>
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
          placeholder="Tìm bài học"
          aria-label="Tìm bài học"
          className="pl-10"
        />
      </div>

      <div role="group" aria-label="Lọc theo độ khó" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(["all", ...DIFFICULTIES] as const).map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={difficulty === d}
            onClick={() => setDifficulty(d)}
            className={cn(
              "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
              difficulty === d ? "border-brand bg-brand-tint text-brand-ink" : "border-line bg-white text-body",
            )}
          >
            {d === "all" ? "Tất cả" : DIFFICULTY_LABEL[d]}
          </button>
        ))}
      </div>

      {skills.isPending || levels.isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-md" />
          ))}
        </div>
      ) : skills.isError ? (
        <Card>
          <p role="alert" className="text-sm text-danger-ink">
            {skills.error.message}
          </p>
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState icon={BookOpen} text="Chưa có bài nào phù hợp. Thử từ khóa hoặc độ khó khác." />
        </Card>
      ) : (
        groups.map((group) => {
          const status = group.level ? levels.data?.levels.find((l) => l.id === group.level.id) : null;
          const locked = status ? !status.unlocked : false;
          return (
            <section key={group.level?.id ?? "loose"} className="flex flex-col gap-3">
              {group.level ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-h3 font-semibold text-ink">
                      Level {group.level.number}: {group.level.name}
                    </h2>
                    {locked ? (
                      <Badge>
                        <Lock aria-hidden /> Chưa mở
                      </Badge>
                    ) : status?.complete ? (
                      <Badge variant="success">
                        <CheckCircle2 aria-hidden /> Hoàn thành
                      </Badge>
                    ) : null}
                  </div>
                  {status && status.requiredTotal > 0 ? (
                    <div className="flex items-center gap-3">
                      <Progress
                        value={(status.requiredDone / status.requiredTotal) * 100}
                        className="flex-1"
                        label={`Level ${group.level.number}`}
                      />
                      <span className="text-caption text-muted">
                        {status.requiredDone}/{status.requiredTotal} bài bắt buộc
                      </span>
                    </div>
                  ) : null}
                  {group.level.description ? <p className="text-sm text-body">{group.level.description}</p> : null}
                  {locked ? (
                    <p className="rounded-sm bg-surface px-3 py-2 text-sm text-body">
                      Hoàn thành các bài bắt buộc ở level trước để mở level này.
                    </p>
                  ) : null}
                </div>
              ) : (
                <h2 className="text-h3 font-semibold text-ink">Bài khác</h2>
              )}
              <ul className="flex flex-col gap-2">
                {group.items.map((s) => {
                  const state = progress.get(s.id);
                  const card = (
                    <>
                      <div className="flex aspect-video w-28 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-line bg-surface">
                        {s.coverFileId ? (
                          // eslint-disable-next-line @next/next/no-img-element -- our own file route
                          <img src={`/api/files/${s.coverFileId}`} alt="" className="size-full object-cover" />
                        ) : (
                          <BookOpen className="size-6 text-muted" aria-hidden />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-ink">{s.title}</p>
                        {s.summary ? <p className="mt-1 line-clamp-2 text-caption text-body">{s.summary}</p> : null}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge>{DIFFICULTY_LABEL[s.difficulty]}</Badge>
                          {s.durationMin ? <Badge>{s.durationMin} phút</Badge> : null}
                          {state === "completed" ? (
                            <Badge variant="success">
                              <CheckCircle2 aria-hidden /> Đã học
                            </Badge>
                          ) : state === "saved" ? (
                            <Badge variant="brand">Đã lưu</Badge>
                          ) : null}
                        </div>
                      </div>
                    </>
                  );
                  return (
                    <li key={s.id}>
                      {locked ? (
                        <div
                          className="flex gap-3 rounded-md border border-line bg-surface p-3 opacity-70"
                          aria-disabled="true"
                        >
                          {card}
                        </div>
                      ) : (
                        <Link
                          href={`/hoc/${s.slug}` as Route}
                          className="flex gap-3 rounded-md border border-line bg-white p-3 active:bg-surface lg:hover:bg-surface"
                        >
                          {card}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

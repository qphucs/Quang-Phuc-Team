"use client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { unwrap } from "@/lib/result";
import { cn } from "@/lib/utils";
import { listMyLearningAction, listSkillsAction } from "../actions";
import { DIFFICULTIES, DIFFICULTY_LABEL } from "../schemas";

type Difficulty = "all" | (typeof DIFFICULTIES)[number];

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

  const progress = useMemo(() => {
    const map = new Map<string, "saved" | "completed">();
    for (const row of learning.data ?? []) map.set(row.skillId, row.status);
    return map;
  }, [learning.data]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1 font-bold">Học</h1>
        <p className="mt-1 text-sm text-body">Các bài hướng dẫn edit CapCut, có video và từng bước làm.</p>
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

      {skills.isPending ? (
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
      ) : skills.data.length === 0 ? (
        <Card>
          <EmptyState icon={BookOpen} text="Chưa có bài nào phù hợp. Thử từ khóa hoặc độ khó khác." />
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {skills.data.map((s) => {
            const state = progress.get(s.id);
            return (
              <li key={s.id}>
                <Link
                  href={`/hoc/${s.slug}` as Route}
                  className="flex gap-3 rounded-md border border-line bg-white p-3 active:bg-surface lg:hover:bg-surface"
                >
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
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

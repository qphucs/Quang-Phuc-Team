"use client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { unwrap } from "@/lib/result";
import { listAdminSkillsAction } from "../actions";
import { DIFFICULTY_LABEL } from "../schemas";

export function AdminSkillList() {
  const query = useQuery({
    queryKey: ["skills-admin"],
    queryFn: async () => unwrap(await listAdminSkillsAction({})),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 font-bold">Bài học</h1>
          <p className="mt-1 text-sm text-body">Soạn và đăng bài hướng dẫn cho team.</p>
        </div>
        <Button asChild>
          <Link href={"/quan-tri/bai-hoc/moi" as Route}>
            <Plus aria-hidden />
            Tạo bài
          </Link>
        </Button>
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
          <EmptyState icon={BookOpen} text="Chưa có bài nào. Tạo bài đầu tiên nhé." />
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {query.data.map((s) => (
            <li key={s.id}>
              <Link
                href={`/quan-tri/bai-hoc/${s.id}` as Route}
                className="flex items-center gap-3 rounded-md border border-line bg-white p-3 active:bg-surface lg:hover:bg-surface"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{s.title}</p>
                  <p className="truncate text-caption text-muted">
                    {DIFFICULTY_LABEL[s.difficulty]}
                    {s.durationMin ? ` · ${s.durationMin} phút` : ""} · Sửa {formatRelative(s.updatedAt)}
                  </p>
                </div>
                <Badge variant={s.status === "published" ? "success" : "neutral"}>
                  {s.status === "published" ? "Đã đăng" : "Nháp"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

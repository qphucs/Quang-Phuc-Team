"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { unwrap } from "@/lib/result";
import { getMyLevels } from "../actions";

/** Home card: the level the member is working on right now and how far along it is. */
export function HomeProgress() {
  const query = useQuery({
    queryKey: ["levels-progress"],
    queryFn: async () => unwrap(await getMyLevels({})),
  });

  if (query.isPending) return <Skeleton className="h-20 w-full rounded-md" />;
  if (query.isError) return <p className="text-sm text-danger-ink">{query.error.message}</p>;

  const { levels, currentLevelId } = query.data;
  const current = levels.find((l) => l.id === currentLevelId);
  if (!current) {
    return <p className="text-caption font-medium text-ink">Lộ trình học chưa có level nào.</p>;
  }
  const pct = current.requiredTotal > 0 ? (current.requiredDone / current.requiredTotal) * 100 : 100;
  const allDone = levels.length > 0 && levels.every((l) => l.complete);

  return (
    <Link href="/hoc" className="flex flex-col gap-2">
      <p className="text-caption font-medium text-ink">
        {allDone ? "Bạn đã hoàn thành lộ trình" : `Level ${current.number}: ${current.name}`}
      </p>
      {current.requiredTotal > 0 && !allDone ? (
        <>
          <Progress value={pct} label={`Tiến độ level ${current.number}`} />
          <p className="text-caption text-body">
            {current.requiredDone}/{current.requiredTotal} bài bắt buộc
          </p>
        </>
      ) : null}
    </Link>
  );
}

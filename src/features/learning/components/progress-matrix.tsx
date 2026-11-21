"use client";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { unwrap } from "@/lib/result";
import { getLearningMatrix } from "../actions";

/** Admin view: who has finished how many required skills in each level. Live via learning.updated events. */
export function ProgressMatrix() {
  const query = useQuery({
    queryKey: ["learning-matrix"],
    queryFn: async () => unwrap(await getLearningMatrix({})),
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1 font-bold">Tiến độ học</h1>
        <p className="mt-1 text-sm text-body">Số bài bắt buộc đã học xong trên tổng số bài bắt buộc của từng level.</p>
      </div>

      {query.isPending ? (
        <Skeleton className="h-64 w-full rounded-md" />
      ) : query.isError ? (
        <Card>
          <p role="alert" className="text-sm text-danger-ink">
            {query.error.message}
          </p>
        </Card>
      ) : query.data.levels.length === 0 ? (
        <Card>
          <EmptyState icon={Users} text="Chưa có level nào. Tạo level ở mục Lộ trình trước." />
        </Card>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-semibold text-ink">
                  Thành viên
                </th>
                {query.data.levels.map((l) => (
                  <th key={l.id} scope="col" className="px-3 py-2 text-center font-semibold whitespace-nowrap text-ink">
                    L{l.number}
                    <span className="block text-caption font-normal text-muted">{l.total} bài</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {query.data.rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={row.name} size={24} />
                      <div className="min-w-0">
                        <p className="max-w-40 truncate font-medium text-ink">{row.name}</p>
                        <p className="text-caption text-muted">@{row.username}</p>
                      </div>
                    </div>
                  </td>
                  {row.cells.map((cell) => {
                    const total = query.data.levels.find((l) => l.id === cell.levelId)?.total ?? 0;
                    const complete = total > 0 && cell.done === total;
                    return (
                      <td key={cell.levelId} className="px-3 py-2 text-center">
                        <span
                          className={
                            complete
                              ? "inline-block rounded-full bg-success-tint px-2.5 py-1 font-semibold text-success-ink"
                              : "inline-block rounded-full bg-surface px-2.5 py-1 text-body"
                          }
                        >
                          {cell.done}/{total}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

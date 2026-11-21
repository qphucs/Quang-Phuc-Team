"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { unwrap } from "@/lib/result";
import { getOwnerSettingsAction, setTrendAutoPublishAction } from "../actions";

export function OwnerSettings() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const query = useQuery({
    queryKey: ["owner-settings"],
    queryFn: async () => unwrap(await getOwnerSettingsAction({})),
  });

  if (query.isPending) return <Skeleton className="h-40 w-full rounded-md" />;
  if (query.isError) {
    return (
      <p role="alert" className="text-sm text-danger-ink">
        {query.error.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1 font-bold">Cài đặt</h1>
        <p className="mt-1 text-sm text-body">Chỉ chủ team thấy mục này.</p>
      </div>
      <Card className="flex flex-col gap-3">
        <label className="flex min-h-11 items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-5 accent-[var(--color-brand-ink)]"
            checked={query.data.trendAutoPublish}
            disabled={pending}
            onChange={async (e) => {
              setPending(true);
              const result = await setTrendAutoPublishAction({ value: e.target.checked });
              setPending(false);
              if (result.ok) {
                toast.success(e.target.checked ? "Trend tự quét sẽ tự đăng." : "Trend tự quét sẽ chờ duyệt.");
                await queryClient.invalidateQueries({ queryKey: ["owner-settings"] });
              } else toast.error(result.error.message);
            }}
          />
          <span>
            <span className="block text-sm font-semibold text-ink">Tự đăng trend từ nguồn tự động</span>
            <span className="block text-caption text-body">
              Khi tắt, trend mới quét được sẽ nằm ở mục Chờ duyệt. Trend thêm tay vẫn do admin quyết định.
            </span>
          </span>
        </label>
      </Card>
      <Card className="flex flex-col gap-2">
        <h2 className="text-h3 font-semibold text-ink">Lịch quét trend</h2>
        <p className="text-sm text-body">06:00 và 18:00 mỗi ngày (giờ Việt Nam), chạy bằng tiến trình worker.</p>
      </Card>
    </div>
  );
}

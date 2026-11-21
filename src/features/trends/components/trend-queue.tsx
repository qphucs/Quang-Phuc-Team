"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pin, PinOff, Plus, TrendingUp, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { formatRelative } from "@/lib/format";
import { unwrap } from "@/lib/result";
import { cn } from "@/lib/utils";
import { addTrendAction, listTrendQueueAction, setTrendPinAction, setTrendStatusAction } from "../actions";
import { addTrendSchema, TREND_TYPES } from "../schemas";
import type { z } from "zod";

type Status = "pending" | "published" | "rejected";
type FormValues = z.input<typeof addTrendSchema>;

const TABS: { value: Status; label: string }[] = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "published", label: "Đã đăng" },
  { value: "rejected", label: "Đã bỏ" },
];

export function TrendQueue() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("pending");
  const [adding, setAdding] = useState(false);

  const query = useQuery({
    queryKey: ["trend-queue", status],
    queryFn: async () => unwrap(await listTrendQueueAction({ status })),
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["trend-queue"] });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 font-bold">Trend</h1>
          <p className="mt-1 text-sm text-body">Duyệt trend trước khi thành viên thấy.</p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus aria-hidden />
          Thêm trend
        </Button>
      </div>

      <div role="tablist" aria-label="Trạng thái" className="grid grid-cols-3 gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={status === t.value}
            onClick={() => setStatus(t.value)}
            className={cn(
              "h-11 rounded-sm border text-sm font-semibold",
              status === t.value ? "border-brand bg-brand-tint text-brand-ink" : "border-line bg-white text-body",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {query.isPending ? (
        <Skeleton className="h-40 w-full rounded-md" />
      ) : query.isError ? (
        <Card>
          <p role="alert" className="text-sm text-danger-ink">
            {query.error.message}
          </p>
        </Card>
      ) : query.data.length === 0 ? (
        <Card>
          <EmptyState icon={TrendingUp} text="Không có trend nào ở mục này." />
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {query.data.map((t) => (
            <li key={t.id}>
              <Card className="flex gap-3">
                <div className="size-20 shrink-0 overflow-hidden rounded-sm border border-line bg-surface">
                  {t.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote TikTok thumbnail
                    <img src={t.coverUrl} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-ink">{t.title || "Không có tiêu đề"}</p>
                  <p className="mt-1 truncate text-caption text-muted">
                    {t.type === "sound" ? "Nhạc" : "Edit CapCut"} · {t.author ? `@${t.author}` : "—"} ·{" "}
                    {t.source === "manual" ? `thêm bởi ${t.addedByName ?? "?"}` : t.source}
                  </p>
                  <p className="text-caption text-muted">{formatRelative(t.firstSeenAt)}</p>
                  {t.isPinned ? (
                    <Badge variant="brand" className="mt-1">
                      <Pin aria-hidden /> Đã ghim
                    </Badge>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {status !== "published" ? (
                      <Button
                        size="sm"
                        onClick={async () => {
                          const r = await setTrendStatusAction({ id: t.id, status: "published" });
                          if (r.ok) {
                            toast.success("Đã đăng trend.");
                            refresh();
                          } else toast.error(r.error.message);
                        }}
                      >
                        <Check aria-hidden /> Đăng
                      </Button>
                    ) : null}
                    {status !== "rejected" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          const r = await setTrendStatusAction({ id: t.id, status: "rejected" });
                          if (r.ok) refresh();
                          else toast.error(r.error.message);
                        }}
                      >
                        <X aria-hidden /> Bỏ
                      </Button>
                    ) : null}
                    {status === "published" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          const r = await setTrendPinAction({ id: t.id, pinned: !t.isPinned });
                          if (r.ok) refresh();
                          else toast.error(r.error.message);
                        }}
                      >
                        {t.isPinned ? <PinOff aria-hidden /> : <Pin aria-hidden />}
                        {t.isPinned ? "Bỏ ghim" : "Ghim"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={adding}
        onOpenChange={setAdding}
        title="Thêm trend"
        description="Dán link TikTok, hệ thống tự lấy tiêu đề và ảnh."
      >
        <AddTrendForm
          onDone={async () => {
            setAdding(false);
            await queryClient.invalidateQueries({ queryKey: ["trend-queue"] });
          }}
        />
      </Sheet>
    </div>
  );
}

function AddTrendForm({ onDone }: { onDone: () => Promise<void> }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(addTrendSchema),
    defaultValues: { url: "", type: TREND_TYPES[0], note: "", publishNow: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await addTrendAction(values);
    if (!result.ok) {
      const fields = result.error.fields ?? {};
      for (const [name, message] of Object.entries(fields)) setError(name as keyof FormValues, { message });
      if (Object.keys(fields).length === 0) toast.error(result.error.message);
      return;
    }
    toast.success("Đã thêm trend.");
    await onDone();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <Label htmlFor="trend-url">Link TikTok</Label>
        <Input
          id="trend-url"
          inputMode="url"
          autoCapitalize="none"
          placeholder="https://www.tiktok.com/@..."
          {...register("url")}
        />
        <FieldError>{errors.url?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="trend-type">Loại</Label>
        <select
          id="trend-type"
          className="h-11 w-full rounded-sm border border-line bg-surface px-3 text-base text-ink focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none"
          {...register("type")}
        >
          <option value="capcut_edit">Edit CapCut</option>
          <option value="sound">Nhạc</option>
        </select>
      </div>
      <div>
        <Label htmlFor="trend-note">Ghi chú cách làm (không bắt buộc)</Label>
        <textarea
          id="trend-note"
          rows={2}
          className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-base text-ink focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none"
          {...register("note")}
        />
        <FieldError>{errors.note?.message}</FieldError>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-ink">
        <input type="checkbox" className="size-5 accent-[var(--color-brand-ink)]" {...register("publishNow")} />
        Đăng ngay (không cần duyệt)
      </label>
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Thêm trend
      </Button>
    </form>
  );
}

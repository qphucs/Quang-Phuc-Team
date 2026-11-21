"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { unwrap } from "@/lib/result";
import { deleteLevelAction, listAllLevels, saveLevelAction } from "../actions";
import { levelSchema, type LevelInput } from "../schemas";

type Level = { id: string; number: number; name: string; description: string };

export function LevelsManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Level | "new" | null>(null);
  const [deleting, setDeleting] = useState<Level | null>(null);

  const query = useQuery({
    queryKey: ["levels"],
    queryFn: async () => unwrap(await listAllLevels({})),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 font-bold">Lộ trình</h1>
          <p className="mt-1 text-sm text-body">
            Chia bài học thành các level. Bài bắt buộc quyết định khi nào mở level mới.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus aria-hidden />
          Thêm level
        </Button>
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
          <EmptyState icon={Layers} text="Chưa có level nào. Thêm Level 1 để bắt đầu lộ trình." />
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {query.data.map((l) => (
            <li key={l.id}>
              <Card className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand-tint text-sm font-bold text-brand-ink">
                  {l.number}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{l.name}</p>
                  {l.description ? <p className="mt-1 text-caption text-body">{l.description}</p> : null}
                </div>
                <Button variant="ghost" size="icon" aria-label={`Sửa ${l.name}`} onClick={() => setEditing(l)}>
                  <Pencil aria-hidden />
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Xóa ${l.name}`} onClick={() => setDeleting(l)}>
                  <Trash2 className="text-danger-ink" aria-hidden />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === "new" || editing === null ? "Thêm level" : "Sửa level"}
      >
        {editing !== null ? (
          <LevelForm
            initial={editing === "new" ? null : editing}
            onSaved={async () => {
              setEditing(null);
              await queryClient.invalidateQueries({ queryKey: ["levels"] });
            }}
          />
        ) : null}
      </Sheet>

      {deleting ? (
        <ConfirmSheet
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title="Xóa level?"
          description={`Các bài trong "${deleting.name}" sẽ không còn thuộc level nào. Bạn vẫn có thể xếp lại sau.`}
          confirmLabel="Xóa level"
          danger
          onConfirm={async () => {
            const result = await deleteLevelAction({ id: deleting.id });
            if (result.ok) {
              toast.success("Đã xóa level.");
              setDeleting(null);
              await queryClient.invalidateQueries({ queryKey: ["levels"] });
              return { ok: true };
            }
            return { ok: false, message: result.error.message };
          }}
        />
      ) : null}
    </div>
  );
}

function LevelForm({ initial, onSaved }: { initial: Level | null; onSaved: () => Promise<void> }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LevelInput>({
    resolver: zodResolver(levelSchema),
    defaultValues: initial
      ? { number: initial.number, name: initial.name, description: initial.description }
      : { number: 1, name: "", description: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveLevelAction({ ...values, id: initial?.id });
    if (!result.ok) {
      const fields = result.error.fields ?? {};
      for (const [name, message] of Object.entries(fields)) setError(name as keyof LevelInput, { message });
      if (Object.keys(fields).length === 0) toast.error(result.error.message);
      return;
    }
    toast.success("Đã lưu level.");
    await onSaved();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <Label htmlFor="level-number">Số thứ tự</Label>
        <Input
          id="level-number"
          type="number"
          inputMode="numeric"
          min={1}
          {...register("number", { valueAsNumber: true })}
        />
        <FieldError>{errors.number?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="level-name">Tên level</Label>
        <Input id="level-name" placeholder="vd: Căn bản" {...register("name")} />
        <FieldError>{errors.name?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="level-desc">Mô tả (không bắt buộc)</Label>
        <textarea
          id="level-desc"
          rows={3}
          className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-base text-ink focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none"
          {...register("description")}
        />
        <FieldError>{errors.description?.message}</FieldError>
      </div>
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Lưu level
      </Button>
    </form>
  );
}

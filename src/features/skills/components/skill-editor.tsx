"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, FileText, ImagePlus, Plus, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { saveSkillAction, publishSkillAction } from "../actions";
import { DIFFICULTIES, DIFFICULTY_LABEL, skillInputSchema, type SkillInput } from "../schemas";
import { uploadFile } from "./file-upload";

type Initial = {
  id: string;
  status: "draft" | "published";
  values: SkillInput;
  coverName: string | null;
  videoName: string | null;
  attachmentNames: Record<string, string>; // fileId → name
  stepMediaNames: Record<string, string>; // fileId → name
};

const selectClass =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-base text-ink focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none";
const areaClass =
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-base text-ink focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none";

export type LevelOption = { id: string; number: number; name: string };

export function SkillEditor({ initial, levels }: { initial?: Initial; levels: LevelOption[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "published">(initial?.status ?? "draft");
  const [names, setNames] = useState({
    cover: initial?.coverName ?? null,
    video: initial?.videoName ?? null,
    ...initial?.attachmentNames,
    ...initial?.stepMediaNames,
  } as Record<string, string | null>);

  const form = useForm<SkillInput>({
    resolver: zodResolver(skillInputSchema) as Resolver<SkillInput>,
    defaultValues: initial?.values ?? {
      title: "",
      summary: "",
      difficulty: "basic",
      durationMin: 0,
      tags: [],
      videoKind: "none",
      isRequired: false,
      steps: [],
      attachments: [],
    },
  });
  const { register, handleSubmit, setValue, watch, control, formState } = form;
  const steps = useFieldArray({ control, name: "steps" });
  const attachments = useFieldArray({ control, name: "attachments" });
  const videoKind = watch("videoKind");
  const tags = (watch("tags") ?? []) as string[];
  const errors = formState.errors;

  async function run<T>(label: string, fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(label);
    try {
      return await fn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra. Hãy thử lại.");
      return undefined;
    } finally {
      setBusy(null);
    }
  }

  const save = handleSubmit(async (values) => {
    const result = await run("save", () => saveSkillAction({ ...values, id: initial?.id }));
    if (!result) return;
    if (!result.ok) {
      const fields = result.error.fields ?? {};
      for (const [name, message] of Object.entries(fields)) {
        form.setError(name as keyof SkillInput, { message });
      }
      toast.error(result.error.message);
      return;
    }
    toast.success("Đã lưu bài.");
    if (!initial) router.replace(`/quan-tri/bai-hoc/${result.data.id}`);
    else router.refresh();
  });

  async function togglePublish() {
    if (!initial) return;
    const next = status !== "published";
    const result = await run("publish", () => publishSkillAction({ id: initial.id, publish: next }));
    if (!result) return;
    if (result.ok) {
      setStatus(result.data.status);
      toast.success(next ? "Đã đăng bài. Thành viên sẽ thấy ngay." : "Đã chuyển về nháp.");
    } else toast.error(result.error.message);
  }

  async function pickFile(
    file: File | undefined,
    purpose: "image" | "video" | "document",
    onDone: (id: string, name: string) => void,
    label: string,
  ) {
    if (!file) return;
    const uploaded = await run(label, () => uploadFile(file, purpose));
    if (uploaded) onDone(uploaded.id, uploaded.originalName);
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Badge variant={status === "published" ? "success" : "neutral"}>
          {status === "published" ? "Đã đăng" : "Nháp"}
        </Badge>
        {initial ? (
          <Button type="button" variant="secondary" loading={busy === "publish"} onClick={togglePublish}>
            {status === "published" ? "Chuyển về nháp" : "Đăng bài"}
          </Button>
        ) : null}
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-h3 font-semibold text-ink">Thông tin</h2>
        <div>
          <Label htmlFor="title">Tiêu đề</Label>
          <Input id="title" aria-invalid={Boolean(errors.title)} {...register("title")} />
          <FieldError>{errors.title?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="summary">Mô tả ngắn</Label>
          <textarea id="summary" rows={2} className={areaClass} {...register("summary")} />
          <FieldError>{errors.summary?.message}</FieldError>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="difficulty">Độ khó</Label>
            <select id="difficulty" className={selectClass} {...register("difficulty")}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABEL[d]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="durationMin">Thời lượng (phút)</Label>
            <Input id="durationMin" type="number" inputMode="numeric" min={0} {...register("durationMin")} />
            <FieldError>{errors.durationMin?.message}</FieldError>
          </div>
        </div>
        <div>
          <Label htmlFor="tags">Thẻ (cách nhau bằng dấu phẩy)</Label>
          <Input
            id="tags"
            placeholder="vd: chuyển cảnh, text, beat"
            defaultValue={tags.join(", ")}
            onBlur={(e) =>
              setValue(
                "tags",
                e.target.value
                  .split(",")
                  .map((t) => t.trim().toLowerCase())
                  .filter(Boolean)
                  .slice(0, 10),
              )
            }
          />
        </div>
        <div>
          <Label htmlFor="capcut">Link template CapCut (không bắt buộc)</Label>
          <Input id="capcut" inputMode="url" autoCapitalize="none" {...register("capcutTemplateUrl")} />
          <FieldError>{errors.capcutTemplateUrl?.message}</FieldError>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="levelId">Level</Label>
            <select id="levelId" className={selectClass} {...register("levelId")}>
              <option value="">Chưa xếp level</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  Level {l.number}: {l.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex min-h-11 items-center gap-3 self-end text-sm font-medium text-ink">
            <input type="checkbox" className="size-5 accent-[var(--color-brand-ink)]" {...register("isRequired")} />
            Bài bắt buộc trong level
          </label>
        </div>
        <div>
          <Label>Ảnh bìa</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" loading={busy === "cover"}>
              <label className="cursor-pointer">
                <ImagePlus aria-hidden />
                Chọn ảnh
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) =>
                    pickFile(
                      e.target.files?.[0],
                      "image",
                      (id, name) => {
                        setValue("coverFileId", id);
                        setNames((n) => ({ ...n, cover: name }));
                      },
                      "cover",
                    )
                  }
                />
              </label>
            </Button>
            <span className="text-sm text-body">{names.cover ?? "Chưa có ảnh bìa"}</span>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-h3 font-semibold text-ink">Video hướng dẫn</h2>
        <div role="radiogroup" aria-label="Nguồn video" className="grid grid-cols-3 gap-2">
          {(
            [
              ["none", "Không có"],
              ["upload", "Tải lên"],
              ["embed", "Dán link"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`flex h-11 cursor-pointer items-center justify-center rounded-sm border text-sm font-medium ${
                videoKind === value ? "border-brand bg-brand-tint text-brand-ink" : "border-line bg-white text-body"
              }`}
            >
              <input type="radio" value={value} className="sr-only" {...register("videoKind")} />
              {label}
            </label>
          ))}
        </div>
        {videoKind === "upload" ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" loading={busy === "video"}>
              <label className="cursor-pointer">
                <Upload aria-hidden />
                Chọn video (MP4/MOV, tối đa 200 MB)
                <input
                  type="file"
                  accept="video/mp4,video/quicktime"
                  className="sr-only"
                  onChange={(e) =>
                    pickFile(
                      e.target.files?.[0],
                      "video",
                      (id, name) => {
                        setValue("videoFileId", id);
                        setNames((n) => ({ ...n, video: name }));
                      },
                      "video",
                    )
                  }
                />
              </label>
            </Button>
            <span className="text-sm text-body">{names.video ?? "Chưa có video"}</span>
          </div>
        ) : null}
        {videoKind === "embed" ? (
          <div>
            <Label htmlFor="embed">Link YouTube hoặc TikTok</Label>
            <Input
              id="embed"
              inputMode="url"
              autoCapitalize="none"
              placeholder="https://youtu.be/..."
              {...register("videoEmbedUrl")}
            />
            <FieldError>{errors.videoEmbedUrl?.message}</FieldError>
          </div>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-semibold text-ink">Các bước</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={steps.fields.length >= 30}
            onClick={() => steps.append({ title: "", body: "", mediaFileId: null })}
          >
            <Plus aria-hidden />
            Thêm bước
          </Button>
        </div>
        {steps.fields.length === 0 ? <p className="text-sm text-muted">Chưa có bước nào.</p> : null}
        {steps.fields.map((field, index) => {
          const mediaId = watch(`steps.${index}.mediaFileId`);
          return (
            <div key={field.id} className="flex flex-col gap-3 rounded-sm border border-line p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">Bước {index + 1}</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Lên"
                    disabled={index === 0}
                    onClick={() => steps.move(index, index - 1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Xuống"
                    disabled={index === steps.fields.length - 1}
                    onClick={() => steps.move(index, index + 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Xóa bước"
                    onClick={() => steps.remove(index)}
                  >
                    <Trash2 className="text-danger-ink" />
                  </Button>
                </div>
              </div>
              <Input
                placeholder="Tên bước"
                aria-label={`Tên bước ${index + 1}`}
                {...register(`steps.${index}.title`)}
              />
              <FieldError>{errors.steps?.[index]?.title?.message}</FieldError>
              <textarea
                rows={3}
                className={areaClass}
                placeholder="Hướng dẫn chi tiết"
                aria-label={`Nội dung bước ${index + 1}`}
                {...register(`steps.${index}.body`)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="secondary" size="sm" loading={busy === `step-${index}`}>
                  <label className="cursor-pointer">
                    <ImagePlus aria-hidden />
                    Ảnh minh họa
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(e) =>
                        pickFile(
                          e.target.files?.[0],
                          "image",
                          (id, name) => {
                            setValue(`steps.${index}.mediaFileId`, id);
                            setNames((n) => ({ ...n, [id]: name }));
                          },
                          `step-${index}`,
                        )
                      }
                    />
                  </label>
                </Button>
                <span className="text-caption text-muted">
                  {mediaId ? (names[mediaId] ?? "Đã có ảnh") : "Chưa có ảnh"}
                </span>
              </div>
            </div>
          );
        })}
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-h3 font-semibold text-ink">Tài liệu đính kèm</h2>
        <Button asChild variant="secondary" loading={busy === "doc"}>
          <label className="cursor-pointer">
            <FileText aria-hidden />
            Thêm tài liệu (PDF, ZIP, font…)
            <input
              type="file"
              accept="application/pdf,application/zip,font/ttf,font/otf,.ttf,.otf,.zip,.pdf"
              className="sr-only"
              onChange={(e) =>
                pickFile(
                  e.target.files?.[0],
                  "document",
                  (id, name) => attachments.append({ fileId: id, label: name.slice(0, 80) }),
                  "doc",
                )
              }
            />
          </label>
        </Button>
        {attachments.fields.length === 0 ? <p className="text-sm text-muted">Chưa có tài liệu.</p> : null}
        {attachments.fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input aria-label={`Tên tài liệu ${index + 1}`} {...register(`attachments.${index}.label`)} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Xóa tài liệu"
              onClick={() => attachments.remove(index)}
            >
              <Trash2 className="text-danger-ink" />
            </Button>
          </div>
        ))}
      </Card>

      <Button type="submit" size="lg" loading={busy === "save"} className="w-full">
        {initial ? "Lưu thay đổi" : "Tạo bài (nháp)"}
      </Button>
    </form>
  );
}

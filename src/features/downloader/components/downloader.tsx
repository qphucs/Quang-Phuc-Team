"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardPaste, Clock, Download, ImageOff, Music, Video } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { formatRelative } from "@/lib/format";
import { unwrap } from "@/lib/result";
import { getMyDownloads, getMyQuota, previewDownload } from "../actions";
import { KIND_LABEL, type DownloadKindLabel, type MediaPreview } from "../types";

function fileHref(url: string, kind: DownloadKindLabel, index = 0) {
  const params = new URLSearchParams({ url, kind, index: String(index) });
  return `/api/downloads/file?${params.toString()}`;
}

function formatDuration(sec: number | null) {
  if (sec === null) return null;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function Downloader() {
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [preview, setPreview] = useState<MediaPreview | null>(null);

  const quota = useQuery({
    queryKey: ["download-quota"],
    queryFn: async () => unwrap(await getMyQuota({})),
  });
  const history = useQuery({
    queryKey: ["download-history"],
    queryFn: async () => unwrap(await getMyDownloads({})),
  });

  const previewMutation = useMutation({
    mutationFn: async (url: string) => unwrap(await previewDownload({ url })),
    onSuccess: (data) => setPreview(data),
    onError: (error) => {
      setPreview(null);
      toast.error(error.message);
    },
  });

  const refreshAfterDownload = () => {
    // The server logs the download when the file starts streaming; refresh counts shortly after.
    setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: ["download-quota"] });
      void queryClient.invalidateQueries({ queryKey: ["download-history"] });
    }, 2500);
  };

  const remaining = quota.data?.remaining ?? null;
  const noQuota = remaining === 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1 font-bold">Tải TikTok</h1>
        <p className="mt-1 text-sm text-body">Dán link video TikTok để tải về không logo.</p>
      </div>

      <Card className="flex flex-col gap-3">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) previewMutation.mutate(value.trim());
          }}
        >
          <div className="flex min-w-0 flex-1 gap-2">
            <Input
              aria-label="Link TikTok"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="https://www.tiktok.com/@..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Dán từ bộ nhớ tạm"
              className="shrink-0"
              onClick={async () => {
                try {
                  setValue(await navigator.clipboard.readText());
                } catch {
                  toast.info("Trình duyệt chưa cho phép đọc bộ nhớ tạm. Hãy dán thủ công.");
                }
              }}
            >
              <ClipboardPaste aria-hidden />
            </Button>
          </div>
          <Button type="submit" loading={previewMutation.isPending} disabled={!value.trim()} className="sm:w-auto">
            Xem trước
          </Button>
        </form>
        <p className="text-caption text-muted">
          {remaining === null ? "Đang kiểm tra lượt tải…" : `Còn ${remaining}/${quota.data?.limit} lượt hôm nay`}
        </p>
      </Card>

      {previewMutation.isPending ? <Skeleton className="h-48 w-full rounded-md" /> : null}

      {preview ? <PreviewCard preview={preview} noQuota={noQuota} onDownloaded={refreshAfterDownload} /> : null}

      <Card className="flex flex-col gap-3">
        <h2 className="text-h3 font-semibold text-ink">Lịch sử của tôi</h2>
        {history.isPending ? (
          <Skeleton className="h-12 w-full" />
        ) : history.isError ? (
          <p role="alert" className="text-sm text-danger-ink">
            {history.error.message}
          </p>
        ) : history.data.length === 0 ? (
          <p className="text-sm text-muted">Bạn chưa tải gì. Thử dán một link ở trên nhé.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {history.data.map((item) => {
              const kind = item.kind as DownloadKindLabel;
              return (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface text-ink">
                    {kind === "video" ? (
                      <Video className="size-4" aria-hidden />
                    ) : kind === "audio" ? (
                      <Music className="size-4" aria-hidden />
                    ) : (
                      <ImageOff className="size-4" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{item.title || "Không có tiêu đề"}</p>
                    <p className="text-caption text-muted">
                      {KIND_LABEL[kind]} · {formatRelative(item.createdAt)}
                    </p>
                  </div>
                  <Badge variant={item.status === "ok" ? "success" : "danger"}>
                    {item.status === "ok" ? "Xong" : "Lỗi"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function PreviewCard({
  preview,
  noQuota,
  onDownloaded,
}: {
  preview: MediaPreview;
  noQuota: boolean;
  onDownloaded: () => void;
}) {
  const [coverFailed, setCoverFailed] = useState(false);
  const duration = formatDuration(preview.durationSec);
  const disabled = noQuota;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex aspect-[9/16] w-24 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-line bg-surface">
          {preview.cover && !coverFailed ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote TikTok cover, shown as-is
            <img
              src={preview.cover}
              alt=""
              referrerPolicy="no-referrer"
              className="size-full object-cover"
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <ImageOff className="size-6 text-muted" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-3 text-sm font-semibold text-ink">{preview.title || "Không có tiêu đề"}</p>
          {preview.author ? <p className="mt-1 truncate text-caption text-muted">@{preview.author}</p> : null}
          {duration ? (
            <p className="mt-2 flex items-center gap-1 text-caption text-muted">
              <Clock className="size-3.5" aria-hidden /> {duration}
            </p>
          ) : null}
        </div>
      </div>

      {noQuota ? (
        <p role="status" className="rounded-sm bg-warning-tint px-3 py-2 text-sm text-warning-ink">
          Bạn đã dùng hết lượt tải hôm nay. Hãy quay lại vào ngày mai.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {preview.hasVideo ? (
          <Button asChild size="lg" className="w-full" aria-disabled={disabled}>
            <a
              href={disabled ? undefined : fileHref(preview.url, "video")}
              download
              onClick={disabled ? (e) => e.preventDefault() : onDownloaded}
            >
              <Download aria-hidden />
              Tải video không logo (MP4)
            </a>
          </Button>
        ) : null}
        {preview.hasAudio ? (
          <Button asChild variant="secondary" size="lg" className="w-full" aria-disabled={disabled}>
            <a
              href={disabled ? undefined : fileHref(preview.url, "audio")}
              download
              onClick={disabled ? (e) => e.preventDefault() : onDownloaded}
            >
              <Music aria-hidden />
              Tải nhạc (MP3)
            </a>
          </Button>
        ) : null}
        {preview.images.map((index) => (
          <Button key={index} asChild variant="secondary" size="lg" className="w-full" aria-disabled={disabled}>
            <a
              href={disabled ? undefined : fileHref(preview.url, "image", index)}
              download
              onClick={disabled ? (e) => e.preventDefault() : onDownloaded}
            >
              <Download aria-hidden />
              Tải ảnh {index + 1}
            </a>
          </Button>
        ))}
        {!preview.hasVideo && !preview.hasAudio && preview.images.length === 0 ? (
          <p className="text-sm text-muted">Không có tệp nào để tải từ link này.</p>
        ) : null}
      </div>
    </Card>
  );
}

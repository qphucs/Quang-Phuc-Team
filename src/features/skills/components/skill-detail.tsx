"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, CheckCircle2, Download, ExternalLink, FileText, Play } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { unwrap } from "@/lib/result";
import { getSkillAction, markCompleteAction, toggleSavedAction } from "../actions";
import { DIFFICULTY_LABEL } from "../schemas";

export function SkillDetail({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["skill", slug],
    queryFn: async () => unwrap(await getSkillAction({ slug })),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["skill", slug] });
    void queryClient.invalidateQueries({ queryKey: ["my-learning"] });
  };

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="aspect-video w-full rounded-md" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <Card className="flex flex-col gap-3">
        <p role="alert" className="text-sm text-danger-ink">
          {query.error.message}
        </p>
        <Link href="/hoc" className="text-sm font-medium text-brand-ink">
          ← Về thư viện
        </Link>
      </Card>
    );
  }

  const { skill, steps, attachments, progress } = query.data;
  const completed = progress === "completed";
  const saved = progress !== null;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/hoc" className="text-sm font-medium text-brand-ink">
        ← Thư viện
      </Link>

      {skill.videoKind === "upload" && skill.videoFileId ? (
        <video
          controls
          playsInline
          preload="metadata"
          src={`/api/files/${skill.videoFileId}`}
          className="aspect-video w-full rounded-md bg-ink"
        />
      ) : skill.videoKind === "embed" && skill.youtubeId ? (
        <div className="aspect-video w-full overflow-hidden rounded-md bg-ink">
          <iframe
            title={skill.title}
            src={`https://www.youtube-nocookie.com/embed/${skill.youtubeId}`}
            className="size-full"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : skill.videoKind === "embed" && skill.videoEmbedUrl ? (
        <Button asChild variant="secondary" size="lg" className="w-full">
          <a href={skill.videoEmbedUrl} target="_blank" rel="noopener noreferrer">
            <Play aria-hidden />
            Xem video trên TikTok
            <ExternalLink aria-hidden />
          </a>
        </Button>
      ) : skill.coverFileId ? (
        // eslint-disable-next-line @next/next/no-img-element -- our own file route
        <img src={`/api/files/${skill.coverFileId}`} alt="" className="aspect-video w-full rounded-md object-cover" />
      ) : null}

      <div>
        <h1 className="text-h1 font-bold">{skill.title}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge>{DIFFICULTY_LABEL[skill.difficulty]}</Badge>
          {skill.durationMin ? <Badge>{skill.durationMin} phút</Badge> : null}
          {skill.tags.map((tag) => (
            <Badge key={tag} variant="violet">
              #{tag}
            </Badge>
          ))}
        </div>
        {skill.summary ? <p className="mt-3 text-base text-body">{skill.summary}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant={saved ? "secondary" : "primary"}
          size="lg"
          onClick={async () => {
            const result = await toggleSavedAction({ skillId: skill.id });
            if (result.ok) {
              toast.success(result.data.saved ? "Đã lưu bài." : "Đã bỏ lưu.");
              refresh();
            } else toast.error(result.error.message);
          }}
        >
          {saved ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />}
          {saved ? "Bỏ lưu" : "Lưu bài"}
        </Button>
        <Button
          variant={completed ? "secondary" : "primary"}
          size="lg"
          onClick={async () => {
            const result = await markCompleteAction({ skillId: skill.id, completed: !completed });
            if (result.ok) {
              toast.success(completed ? "Đã bỏ đánh dấu." : "Đã đánh dấu là đã học. Làm tiếp nhé!");
              refresh();
            } else toast.error(result.error.message);
          }}
        >
          <CheckCircle2 aria-hidden />
          {completed ? "Bỏ đánh dấu đã học" : "Đánh dấu đã học"}
        </Button>
      </div>

      {skill.capcutTemplateUrl ? (
        <Button asChild variant="secondary" size="lg" className="w-full">
          <a href={skill.capcutTemplateUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            Mở template CapCut
          </a>
        </Button>
      ) : null}

      {steps.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-h2 font-semibold">Các bước làm</h2>
          <ol className="flex flex-col gap-3">
            {steps.map((step, index) => (
              <li key={step.id}>
                <Card className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-tint text-caption font-bold text-brand-ink">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{step.title}</p>
                      {step.body ? <p className="mt-1 text-sm whitespace-pre-line text-body">{step.body}</p> : null}
                    </div>
                  </div>
                  {step.mediaFileId ? (
                    // eslint-disable-next-line @next/next/no-img-element -- our own file route
                    <img
                      src={`/api/files/${step.mediaFileId}`}
                      alt={`Minh họa bước ${index + 1}`}
                      loading="lazy"
                      className="w-full rounded-sm border border-line object-cover"
                    />
                  ) : null}
                </Card>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {attachments.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-h2 font-semibold">Tài liệu</h2>
          {attachments.map((a) => (
            <Button key={a.id} asChild variant="secondary" size="lg" className="w-full justify-start">
              <a href={`/api/files/${a.fileId}`} download={a.label}>
                <FileText aria-hidden />
                <span className="truncate">{a.label}</span>
                <Download className="ml-auto" aria-hidden />
              </a>
            </Button>
          ))}
        </section>
      ) : null}
    </div>
  );
}

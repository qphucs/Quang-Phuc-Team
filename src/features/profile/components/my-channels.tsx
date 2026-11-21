"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { unwrap } from "@/lib/result";
import { addMyChannel, listMyChannels, removeMyChannel } from "../actions";

export function MyChannels() {
  const queryClient = useQueryClient();
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);

  const query = useQuery({
    queryKey: ["my-channels"],
    queryFn: async () => unwrap(await listMyChannels({})),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["my-channels"] });

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-h3 font-semibold text-ink">Kênh TikTok của tôi</h2>
        <p className="mt-1 text-sm text-body">Thêm các kênh bạn đang đăng video.</p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!handle.trim()) return;
          setBusy(true);
          const result = await addMyChannel({ username: handle });
          setBusy(false);
          if (!result.ok) {
            toast.error(result.error.fields?.username ?? result.error.message);
            return;
          }
          setHandle("");
          await refresh();
        }}
      >
        <Input
          aria-label="Tên kênh TikTok"
          placeholder="@tenkenh"
          autoCapitalize="none"
          autoCorrect="off"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
        <Button type="submit" variant="secondary" loading={busy} aria-label="Thêm kênh" className="shrink-0">
          <Plus aria-hidden />
          Thêm
        </Button>
      </form>

      {query.isPending ? (
        <Skeleton className="h-11 w-full" />
      ) : query.isError ? (
        <p role="alert" className="text-sm text-danger-ink">
          {query.error.message}
        </p>
      ) : query.data.length === 0 ? (
        <p className="text-sm text-muted">Chưa có kênh nào.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {query.data.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2">
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 min-w-0 flex-1 items-center gap-2 text-sm font-medium text-brand-ink"
              >
                <span className="truncate">@{c.username}</span>
                <ExternalLink className="size-4 shrink-0" aria-hidden />
              </a>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Xóa kênh @${c.username}`}
                onClick={async () => {
                  const result = await removeMyChannel({ id: c.id });
                  if (!result.ok) toast.error(result.error.message);
                  else await refresh();
                }}
              >
                <Trash2 className="text-muted" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

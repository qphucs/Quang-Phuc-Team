"use client";
import { Download, Inbox, Save, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { formatCompact, formatDateTime, formatNumber, formatRelative } from "@/lib/format";

const SWATCHES = [
  ["brand", "bg-brand"],
  ["brand-ink", "bg-brand-ink"],
  ["brand-tint", "bg-brand-tint"],
  ["violet-tint", "bg-violet-tint"],
  ["pink-tint", "bg-pink-tint"],
  ["ink", "bg-ink"],
  ["body", "bg-body"],
  ["muted", "bg-muted"],
  ["line", "bg-line"],
  ["surface", "bg-surface"],
  ["accent-cyan", "bg-accent-cyan"],
  ["accent-violet", "bg-accent-violet"],
  ["accent-pink", "bg-accent-pink"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["danger", "bg-danger"],
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h2 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function KitchenSink() {
  const [sample] = useState(() => new Date(Date.now() - 5 * 60 * 1000));
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-8">
      <header>
        <h1 className="text-display font-bold">Kitchen sink</h1>
        <p className="text-sm text-muted">
          Mọi component đã khóa theo docs/02-design-system.md. Chỉ hiện khi chạy dev.
        </p>
      </header>

      <Section title="Màu">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SWATCHES.map(([name, cls]) => (
            <div key={name} className="overflow-hidden rounded-md border border-line">
              <div className={`h-12 ${cls}`} />
              <p className="px-3 py-2 text-caption font-medium text-ink">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Chữ">
        <p className="text-display font-bold text-ink">Display 30 — Chào bạn</p>
        <p className="text-h1 font-bold text-ink">H1 24 — Thư viện Skill</p>
        <p className="text-h2 font-semibold text-ink">H2 20 — Trend nóng hôm nay</p>
        <p className="text-h3 font-semibold text-ink">H3 18 — Chuyển cảnh zoom theo beat</p>
        <p className="text-base">Base 16 — Dấu tiếng Việt: ắ ặ ẫ ở ữ ỹ Đ đ.</p>
        <p className="text-sm">Sm 14 — Mô tả ngắn trong card.</p>
        <p className="text-caption font-medium text-muted">
          Caption 12 — {formatRelative(sample)} · {formatDateTime(sample)} · {formatCompact(1_234_567)} ·{" "}
          {formatNumber(12500)}
        </p>
      </Section>

      <Section title="Nút">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Download aria-hidden />
            Tải video
          </Button>
          <Button variant="secondary">
            <Save aria-hidden />
            Lưu bài
          </Button>
          <Button variant="ghost">Bỏ qua</Button>
          <Button variant="danger">
            <Trash2 aria-hidden />
            Xóa
          </Button>
          <Button loading>Đang lưu</Button>
          <Button disabled>Không dùng được</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Nhỏ 36</Button>
          <Button size="md">Vừa 44</Button>
          <Button size="lg">Lớn 52</Button>
          <Button size="icon" variant="secondary" aria-label="Tải xuống">
            <Download />
          </Button>
        </div>
      </Section>

      <Section title="Nhãn">
        <div className="flex flex-wrap gap-2">
          <Badge>Cơ bản</Badge>
          <Badge variant="brand">Level 2</Badge>
          <Badge variant="success">Đã học</Badge>
          <Badge variant="warning">Chờ duyệt</Badge>
          <Badge variant="danger">Đã khóa</Badge>
          <Badge variant="violet">CapCut</Badge>
          <Badge variant="pink">Nhạc</Badge>
        </div>
      </Section>

      <Section title="Ô nhập">
        <div className="max-w-sm">
          <Label htmlFor="ks-link">Link TikTok</Label>
          <Input id="ks-link" placeholder="Dán link video TikTok…" />
        </div>
        <div className="max-w-sm">
          <Label htmlFor="ks-err">Tên đăng nhập</Label>
          <Input id="ks-err" aria-invalid defaultValue="ab" />
          <FieldError>Tên đăng nhập có ít nhất 3 ký tự.</FieldError>
        </div>
      </Section>

      <Section title="Card, avatar, tiến độ">
        <Card className="flex items-center gap-4">
          <Avatar name="Minh Anh" size={40} />
          <div className="flex-1">
            <CardTitle>Minh Anh</CardTitle>
            <CardDescription>Level 2 · 8/13 bài</CardDescription>
            <Progress value={62} className="mt-2" label="Tiến độ học" />
          </div>
        </Card>
        <div className="flex items-end gap-3">
          <Avatar name="An" size={24} />
          <Avatar name="Bình" size={32} />
          <Avatar name="Chi" size={40} />
          <Avatar name="Dũng" size={64} />
        </div>
        <Card interactive>
          <CardTitle>Card bấm được</CardTitle>
          <CardDescription>Nhấn giữ để thấy nền đổi màu.</CardDescription>
        </Card>
      </Section>

      <Section title="Đang tải & trống">
        <Card className="flex gap-3">
          <Skeleton className="aspect-video w-24 rounded-sm" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </Card>
        <Card>
          <EmptyState
            icon={Inbox}
            text="Chưa có bài nào được lưu."
            action={<Button variant="secondary">Khám phá bài học</Button>}
          />
        </Card>
      </Section>

      <Section title="Bottom sheet & toast">
        <div className="flex flex-wrap gap-3">
          <Sheet
            title="Tải video"
            description="Chọn định dạng bạn muốn tải."
            trigger={<Button variant="secondary">Mở bottom sheet</Button>}
          >
            <div className="flex flex-col gap-2">
              <Button className="w-full">Video không logo (MP4)</Button>
              <Button variant="secondary" className="w-full">
                Nhạc (MP3)
              </Button>
            </div>
          </Sheet>
          <Button variant="secondary" onClick={() => toast.success("Đã lưu bài.")}>
            Toast thành công
          </Button>
          <Button variant="secondary" onClick={() => toast.error("Link không hợp lệ. Hãy dán link video TikTok.")}>
            Toast lỗi
          </Button>
          <Button variant="secondary" onClick={() => toast.info("Có 3 trend mới.")}>
            Toast thông tin
          </Button>
        </div>
      </Section>
    </main>
  );
}

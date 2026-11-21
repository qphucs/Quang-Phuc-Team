# 04 — Kiến trúc & Database

> Cập nhật: 2026-11-21 · Trạng thái: v1

## 1. Sơ đồ tổng

```
 Điện thoại / Máy tính (PWA)
          │  HTTPS
          ▼
 ┌───────────────────────────── Next.js app ─────────────────────────────┐
 │  Trang (Server Components)   Server Actions   /api/events (SSE)        │
 │  /api/upload   /api/downloads/*   /api/files/*                         │
 └───────┬───────────────────────────┬───────────────────────┬──────────┘
         │ Drizzle                   │ LISTEN/NOTIFY         │ lib/storage
         ▼                           ▼                       ▼
   PostgreSQL  ◄──────────────  (sự kiện realtime)     Ổ đĩa local / R2
         ▲
         │ Drizzle
 ┌───────┴──────── worker (tiến trình riêng) ────────┐
 │ node-cron: quét trend 06:00 & 18:00               │
 │ Xử lý video sau upload (thumbnail ffmpeg)         │
 │ Dọn log tải cũ (> 90 ngày)                         │
 └───────┬───────────────────────────────────────────┘
         ▼
  Nguồn ngoài: TikTok (trend nhạc, video #capcut), nhà cung cấp tải không logo
```

## 2. Môi trường chạy

|            | Local (bây giờ)                       | Deploy (sau) — vẫn free                                |
| ---------- | ------------------------------------- | ------------------------------------------------------ |
| Web        | `pnpm dev` → http://localhost:3000    | Vercel                                                 |
| Worker     | `pnpm worker` (cửa sổ terminal thứ 2) | Máy chủ nhỏ free (Render/Railway) hoặc cron của Vercel |
| PostgreSQL | **Cài PostgreSQL trên Windows**       | Supabase / Neon (free)                                 |
| Lưu file   | Thư mục `./storage`                   | Cloudflare R2 (10GB free)                              |

> Máy bạn đã có Node 25, npm, Git. **Chưa có Docker và PostgreSQL** → Sprint 0 sẽ hướng dẫn cài PostgreSQL (khoảng 5 phút).
> Lưu ý: Node 25 là bản thử nghiệm; khuyên cài **Node 24 LTS** cho ổn định (không bắt buộc).

## 3. Các module kỹ thuật quan trọng

### 3.1 Bộ quét trend (adapter — thay nguồn không sửa code khác)

```ts
interface TrendSource {
  name: string; // "tiktok-creative-center", "tikwm-search", "apify"...
  type: "capcut_edit" | "sound";
  fetch(): Promise<RawTrend[]>; // lấy dữ liệu thô
}
```

Luồng mỗi lần chạy:

1. Gọi từng nguồn đang bật → dữ liệu thô.
2. Chuẩn hóa → upsert vào `trend_items` theo `external_id` (không trùng).
3. Lưu "ảnh chụp" số liệu vào `trend_snapshots` (view, lượt dùng, thời điểm).
4. Tính **điểm nóng** = tốc độ tăng view/lượt dùng trong 24h giữa 2 lần chụp, có trọng số độ mới.
5. Trend vượt ngưỡng → trạng thái `pending` (chờ admin duyệt) hoặc `published` nếu bật tự đăng.
6. Ghi kết quả vào `trend_runs` (thành công/lỗi, số lượng) → admin thấy nguồn nào đang hỏng.

Nguồn dữ liệu dự kiến (miễn phí trước):

| Loại          | Nguồn                                                                                                             | Ghi chú                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Nhạc          | Trang nhạc thịnh hành của TikTok Creative Center (lọc Việt Nam)                                                   | Không chính thức → có thể hỏng khi TikTok đổi |
| Edit CapCut   | Tìm video theo hashtag `#capcut`, `#capcuttemplate`, `#xuhuongcapcut`, `#mẫucapcut`… và video gắn template CapCut | Ưu tiên video mới (< 72h) tăng view nhanh     |
| Dự phòng      | Admin dán link thủ công                                                                                           | Luôn hoạt động                                |
| Trả phí (sau) | Apify / RapidAPI                                                                                                  | Chỉ thêm 1 file adapter                       |

### 3.2 Tải TikTok không logo (provider — đổi nguồn bằng biến môi trường)

```ts
interface TiktokProvider {
  resolve(url: string): Promise<{
    kind: "video" | "images";
    author: string;
    caption: string;
    cover: string;
    videoNoWatermark?: string;
    images?: string[];
    audio?: string;
  }>;
}
```

- `TIKTOK_PROVIDER=free` (mặc định) → dịch vụ phân giải miễn phí; `=paid` → API trả phí sau này.
- Server **đứng giữa** tải file và trả về cho điện thoại (người dùng không thấy nguồn, đặt được tên file đẹp, ghi log).
- Cache kết quả phân giải 1 giờ theo link → bấm lại không tốn lượt.
- ⚠️ Rủi ro: vi phạm điều khoản TikTok, nguồn free có thể chậm/hỏng. Chỉ dùng nội bộ, có giới hạn lượt, có log.

### 3.3 Realtime

`emit(type, payload)` → `pg_notify('events', json)` → route `/api/events` đang `LISTEN` đẩy qua SSE → client TanStack Query làm mới đúng dữ liệu. Worker cũng phát được sự kiện (vd: `trend.detected`) vì đi qua Postgres.

## 4. Database (bản v1)

```
users ──< tiktok_channels
  │
  ├──< learning_progress >── skills ──< skill_steps
  │                           │  └──< skill_attachments ── files
  │                           └── levels
  ├──< saved_items (skill | trend)
  ├──< downloads
  ├──< notifications
  └──< audit_logs

trend_items ──< trend_snapshots
     └── skill_id (gắn bài "cách làm", tuỳ chọn)
trend_runs
settings
```

| Bảng                                  | Cột chính                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **users**                             | id, username (unique), name, avatar_file_id, phone, role (`owner\|admin\|member`), status (`active\|paused\|left`), joined_at, must_change_password, banned, admin_note, last_seen_at, deleted_at                                                                                                                            |
| _(sessions, accounts, verifications)_ | Bảng của Better Auth — sinh tự động                                                                                                                                                                                                                                                                                          |
| **tiktok_channels**                   | id, user_id, username, url, is_primary                                                                                                                                                                                                                                                                                       |
| **levels**                            | id, number (1,2,3…), name, description, sort_order                                                                                                                                                                                                                                                                           |
| **skills**                            | id, slug (unique), title, summary, cover_file_id, video_kind (`upload\|embed`), video_file_id, video_embed_url, difficulty (`basic\|intermediate\|advanced`), duration_min, level_id, is_required (bắt buộc trong level), capcut_template_url, tags text[], status (`draft\|published`), author_id, published_at, deleted_at |
| **skill_steps**                       | id, skill_id, order, title, body (markdown), media_file_id                                                                                                                                                                                                                                                                   |
| **skill_attachments**                 | id, skill_id, file_id, label                                                                                                                                                                                                                                                                                                 |
| **files**                             | id, kind (`image\|video\|document`), mime, size_bytes, storage_key, width, height, duration_sec, thumbnail_key, uploaded_by                                                                                                                                                                                                  |
| **learning_progress**                 | user_id + skill_id (khóa chính kép), status (`saved\|completed`), completed_at                                                                                                                                                                                                                                               |
| **trend_items**                       | id, type (`capcut_edit\|sound`), source, external_id (unique theo source), title, url, cover_url, author, sound_name, view_count, use_count, heat_score, status (`pending\|published\|rejected`), is_pinned, skill_id, first_seen_at, published_at                                                                           |
| **trend_snapshots**                   | id, trend_id, view_count, use_count, captured_at                                                                                                                                                                                                                                                                             |
| **trend_runs**                        | id, source, started_at, finished_at, ok, found_count, new_count, error                                                                                                                                                                                                                                                       |
| **saved_items**                       | user_id, item_type (`skill\|trend`), item_id, created_at                                                                                                                                                                                                                                                                     |
| **downloads**                         | id, user_id, source_url, kind, title, author, status (`ok\|failed`), error, created_at                                                                                                                                                                                                                                       |
| **notifications**                     | id, user_id, type, title, link, read_at                                                                                                                                                                                                                                                                                      |
| **audit_logs**                        | id, actor_id, action, target_type, target_id, meta jsonb, created_at                                                                                                                                                                                                                                                         |
| **settings**                          | key, value jsonb (vd: `download_daily_limit`, `trend_auto_publish`, `trend_schedule`)                                                                                                                                                                                                                                        |

Quy tắc mở khóa level: member mở được Level N+1 khi đã `completed` tất cả skill `is_required = true` của Level N. Tính khi đọc, không lưu trùng.

## 5. Bản đồ màn hình

**Member (mobile, bottom nav)**

| Tab       | Màn hình                                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| Trang chủ | Lời chào + level + tiến độ · Trend nóng hôm nay (3) · Bài skill mới · Lối tắt "Tải TikTok"                           |
| Học       | Lộ trình Level 1→3 (thẻ khóa/mở) · Tìm kiếm & lọc tag · Chi tiết bài: video, các bước, tài liệu, nút "Đã học"        |
| Trend     | Tab: Edit CapCut · Nhạc · Đã lưu · Lọc Hôm nay/7 ngày · Chi tiết: video/sound, số liệu, bài "cách làm", nút Tải      |
| Tải       | Ô dán link (tự đọc clipboard) · Xem trước · Nút Tải video / Tải ảnh / Tải MP3 · Lịch sử của tôi · Còn X lượt hôm nay |
| Tôi       | Hồ sơ, kênh TikTok, đổi mật khẩu, bài đã lưu, (admin) → Quản trị                                                     |

**Admin (desktop ưu tiên, vẫn dùng được trên mobile)**

| Mục             | Màn hình                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Tổng quan       | Số thành viên · Đang online · Trend chờ duyệt · Lượt tải hôm nay · Hoạt động gần đây (realtime)   |
| Thành viên      | Bảng danh sách + lọc trạng thái · Tạo tài khoản · Chi tiết: hồ sơ, kênh, tiến độ học, lịch sử tải |
| Skill           | Danh sách bài · Trình soạn bài (upload video/ảnh/file, kéo thả sắp bước) · Quản lý Level          |
| Trend           | Hàng chờ duyệt (vuốt/duyệt nhanh) · Đã đăng · Thêm thủ công · Tình trạng nguồn quét               |
| Tiến độ học     | Bảng ma trận người × level                                                                        |
| Nhật ký         | Audit log · Log tải                                                                               |
| Cài đặt (owner) | Giới hạn tải, lịch quét, tự đăng trend, quản lý admin                                             |

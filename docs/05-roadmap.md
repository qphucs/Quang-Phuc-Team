# 05 — Roadmap build

> Cập nhật: 2026-11-21 · Mục tiêu: **có bản dùng được sớm nhất**. Mỗi sprint kết thúc là một bản chạy được, dùng thử được ngay.
> Thứ tự ưu tiên: thứ team dùng hằng ngày và rủi ro thấp làm trước; thứ phụ thuộc nguồn ngoài (trend tự động) làm sau.

| Sprint | Tên                | Kết quả dùng được                                           | Tag      |
| ------ | ------------------ | ----------------------------------------------------------- | -------- |
| 0      | Khung dự án        | Mở localhost thấy giao diện đúng màu/font, đăng nhập được   | `v0.1.0` |
| 1      | Thành viên & Admin | Admin tạo 20 tài khoản, member đăng nhập trên điện thoại    | `v0.2.0` |
| 2      | Tải TikTok         | Cả team tải video/ảnh không logo hằng ngày                  | `v0.3.0` |
| 3      | Thư viện Skill     | Admin đăng bài có video, member xem & học                   | `v0.4.0` |
| 4      | Lộ trình học       | Level 1→3, mở khóa, bảng tiến độ cho admin                  | `v0.5.0` |
| 5      | Radar Trend        | Trend CapCut + nhạc tự quét mỗi ngày, admin duyệt           | `v0.6.0` |
| 6      | Hoàn thiện         | PWA, thông báo, realtime toàn bộ, kiểm thử, sẵn sàng deploy | `v1.0.0` |

> Vì sao **Tải TikTok** làm trước Skill? Nó độc lập, nhỏ, và ai cũng dùng ngay → team có lý do mở web từ tuần đầu trong lúc admin chuẩn bị nội dung skill.

---

## Sprint 0 — Khung dự án

**Bạn làm:**

- [ ] Cài PostgreSQL 17 cho Windows (Claude hướng dẫn từng bước), tạo database `qpteam`
- [ ] (Tuỳ chọn) Cài Node 24 LTS

**Claude làm:**

- [x] Khởi tạo Next.js + TypeScript strict + pnpm, Git repo
- [x] Cài Tailwind v4 + `tokens.css` (đúng `02-design-system.md`, đã xóa bảng màu mặc định)
- [x] Cài shadcn/ui, chỉnh các component cơ bản theo token: Button, Input, Card, Badge, Avatar, Sheet, Toast, Skeleton
- [x] Drizzle + kết nối Postgres + migration đầu tiên
- [x] Better Auth (username/password) + trang Đăng nhập + bắt đổi mật khẩu lần đầu
- [x] Layout app: top bar, bottom nav 5 tab (mobile), sidebar (desktop)
- [x] `lib/action.ts`, `lib/errors.ts`, `lib/permissions.ts`, `lib/format.ts`
- [x] ESLint, Prettier, Husky; lệnh `pnpm seed` tạo tài khoản owner
- [x] Trang `/kitchen-sink` (chỉ dev) hiển thị toàn bộ component để soát thiết kế

**Xong khi:** đăng nhập bằng tài khoản owner trên điện thoại (cùng wifi) thấy layout đúng thiết kế.

## Sprint 1 — Thành viên & Admin

- [x] Bảng `users`, `tiktok_channels`, `audit_logs`, `settings`
- [x] Admin: danh sách thành viên (tìm, lọc trạng thái), tạo tài khoản (sinh mật khẩu tạm), sửa, khóa/mở, reset mật khẩu, đổi vai trò (owner)
- [x] Hồ sơ thành viên: thông tin cơ bản, nhiều kênh TikTok, ghi chú admin
- [x] Trang "Tôi": sửa hồ sơ, đổi mật khẩu (avatar chuyển sang Sprint 6)
- [x] SSE `/api/events` + trạng thái online + danh sách thành viên cập nhật realtime
- [ ] Upload ảnh avatar qua `lib/storage` (local) — hoãn sang Sprint 6

**Xong khi:** admin tạo tài khoản trên máy tính → member đăng nhập trên điện thoại → admin thấy member "đang online" không cần F5.

## Sprint 2 — Tải TikTok không logo

- [ ] Provider `free` + interface để đổi `paid` sau
- [ ] Trang Tải: dán link (nút "Dán" đọc clipboard), xem trước, tải video MP4 / ảnh (từng ảnh + zip) / MP3
- [ ] Server proxy file, tên file `tacgia_mota_ngay.mp4`
- [ ] Giới hạn lượt/ngày (đọc từ `settings`), lịch sử tải cá nhân, log toàn team cho admin
- [ ] Xử lý lỗi rõ ràng: link sai, video riêng tư, nguồn lỗi

**Xong khi:** từ điện thoại dán link TikTok → có file video không logo trong máy < 10 giây.

## Sprint 3 — Thư viện Skill

- [ ] Bảng `files`, `skills`, `skill_steps`, `skill_attachments`
- [ ] Upload video/ảnh/tài liệu (giới hạn dung lượng, kiểm tra định dạng), worker tạo thumbnail video
- [ ] Video: chọn **upload** hoặc **dán link nhúng** YouTube/TikTok
- [ ] Trình soạn bài cho admin: thông tin, các bước (thêm/xóa/kéo thả), tài liệu, nháp/đăng
- [ ] Member: danh sách bài (tìm, lọc tag/độ khó), chi tiết bài, lưu bài, tải tài liệu

**Xong khi:** admin đăng 1 bài có video + 3 bước trong < 5 phút, member xem mượt trên điện thoại.

## Sprint 4 — Lộ trình học

- [ ] Bảng `levels`, `learning_progress`; admin tạo level, xếp bài, đánh dấu bài bắt buộc
- [ ] Member: màn lộ trình (level khóa/mở), nút "Đã học", % tiến độ, level hiện tại trên hồ sơ
- [ ] Admin: ma trận tiến độ người × level, xem chi tiết từng người
- [ ] Realtime: member học xong → bảng admin cập nhật ngay

**Xong khi:** member học xong bài bắt buộc Level 1 → Level 2 tự mở; admin thấy ngay.

## Sprint 5 — Radar Trend

- [ ] Bảng `trend_items`, `trend_snapshots`, `trend_runs`
- [ ] Worker + node-cron (06:00 & 18:00, chỉnh trong settings) + nút "Quét ngay" cho admin
- [ ] Adapter nhạc thịnh hành VN + adapter video edit CapCut theo hashtag
- [ ] Tính điểm nóng, hàng chờ duyệt, tự đăng (bật/tắt)
- [ ] Admin: duyệt nhanh, ghim, gắn bài skill "cách làm", thêm trend thủ công, xem tình trạng nguồn
- [ ] Member: feed trend (CapCut/Nhạc/Đã lưu), lọc thời gian, lưu, tải video trend bằng module Sprint 2

**Xong khi:** sáng ra mở admin có ≥ 5 trend mới trong hàng chờ mà không ai nhập tay.

## Sprint 6 — Hoàn thiện

- [ ] PWA: cài lên màn hình, icon, splash
- [ ] Thông báo trong app (bài mới, trend được ghim)
- [ ] Trang chủ hoàn chỉnh + dashboard admin
- [ ] Rà soát toàn bộ theo checklist "XONG" (`03-conventions.md` mục 12)
- [ ] Test Playwright các luồng chính
- [ ] Hướng dẫn deploy free (Vercel + Supabase/Neon + R2) — làm khi bạn có tên miền

## Giai đoạn 2 (sau v1.0, chưa cam kết)

- Kéo số liệu kênh TikTok của thành viên (follower, view)
- API trả phí cho tải & trend
- Giao việc / quy trình duyệt video
- Dark mode

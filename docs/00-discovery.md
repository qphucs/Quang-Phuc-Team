# 00 — Phân tích & Câu hỏi khám phá (Discovery)

> Dự án: **Web Quang Phúc Team** — cổng tiện ích nội bộ cho team agency edit CapCut.
> Trạng thái: **Giai đoạn 0 — Làm rõ yêu cầu.** Chưa viết code. Chưa khóa thiết kế.
> Ngày tạo: 2026-11-21

Tài liệu này gom lại toàn bộ ý tưởng của bạn, chia thành từng module, chỉ ra chỗ còn mơ hồ và đặt câu hỏi. Khi bạn trả lời xong, mình sẽ viết tiếp:

- `01-scope.md` — phạm vi MVP đã chốt (cái gì làm, cái gì KHÔNG làm)
- `02-design-system.md` — khóa bảng màu, font, spacing, component, icon, giọng văn
- `03-conventions.md` — quy ước chung frontend ↔ backend (đặt tên, API, DB, lỗi, ngày giờ, phân quyền)
- `04-architecture.md` — kiến trúc, schema database, luồng dữ liệu realtime
- `05-roadmap.md` — kế hoạch build theo từng sprint, có tiêu chí "xong"

---

## ✅ Đã chốt (cập nhật 2026-11-21)

| Hạng mục            | Quyết định                                                       |
| ------------------- | ---------------------------------------------------------------- |
| Loại trend theo dõi | **Trend edit CapCut** + **Trend âm thanh/nhạc** (TikTok)         |
| Quy mô              | **Dưới 30 người**, tài khoản do **admin cấp** (không tự đăng ký) |
| Môi trường          | **Chạy localhost trước**, deploy sau                             |
| Công nghệ           | Claude chọn stack tối ưu (xem mục 3)                             |
| Creator là ai       | ❓ Chưa rõ — đang hỏi lại                                        |

---

## 1. Bức tranh tổng — 4 module + 1 nền tảng

| #   | Module                                                      | Ai dùng                                | Giá trị cốt lõi                               |
| --- | ----------------------------------------------------------- | -------------------------------------- | --------------------------------------------- |
| A   | **Thư viện Skill** (video mẫu + hướng dẫn)                  | Thành viên đọc, Admin đăng             | Đào tạo editor nhanh, chuẩn hóa tay nghề      |
| B   | **Radar Xu hướng** (cập nhật mỗi ngày)                      | Thành viên xem, Admin/Trend-scout nhập | Biết trend nào đang lên để làm theo kịp       |
| C   | **Quản lý Creator** (mẫu đăng, số liệu realtime)            | Admin quản lý, Creator tự cập nhật     | Nắm toàn bộ team đang làm gì, hiệu quả ra sao |
| D   | **Tiện ích tải TikTok không logo** (ảnh + video)            | Tất cả thành viên                      | Lấy nguyên liệu nhanh để edit/phân tích       |
| 0   | **Nền tảng**: đăng nhập, phân quyền, thông báo, admin panel | Tất cả                                 | Mọi module đều dựa vào đây                    |

---

## 2. Phân tích từng module & chỗ còn mơ hồ

### A. Thư viện Skill

**Mình hiểu:** mỗi "skill" = 1 video kết quả mẫu + hướng dẫn từng bước làm trong CapCut.

Đề xuất cấu trúc 1 bài Skill:

- Tiêu đề, ảnh bìa, video kết quả (before/after nếu có)
- Độ khó (Cơ bản / Trung bình / Nâng cao), thời lượng làm
- Tag: loại hiệu ứng (transition, text, keyframe, color, beat-sync, mask…), ngách nội dung
- Các bước (step 1, 2, 3 — mỗi bước có ảnh/clip ngắn + mô tả)
- Link template CapCut (nếu có), file tài nguyên đính kèm (font, preset, nhạc)
- Thành viên đánh dấu "Đã học" / "Lưu" → admin thấy tiến độ học của team

**Chỗ mơ hồ:** video lưu ở đâu (upload thẳng lên web = tốn tiền lưu trữ; nhúng TikTok/YouTube = miễn phí nhưng phụ thuộc bên ngoài)? Có cần lộ trình học / bài kiểm tra không?

### B. Radar Xu hướng — ĐÂY LÀ CHỖ PHẠM VI BỊ RỘNG

"Xu hướng mỗi ngày" có thể là hàng chục thứ khác nhau. Gợi ý cách thu hẹp theo 3 trục:

1. **Loại trend** — chọn 1–2 để bắt đầu:
   - (a) **Trend template/hiệu ứng CapCut** đang viral → liên quan trực tiếp nghề edit ⭐ _đề xuất_
   - (b) Trend âm thanh/nhạc TikTok
   - (c) Trend format nội dung (kiểu kịch bản, hook, cách kể)
   - (d) Trend hashtag/chủ đề
2. **Thị trường:** chỉ TikTok Việt Nam (đề xuất) hay cả quốc tế?
3. **Ngách:** chỉ những ngách khách hàng của agency đang làm (vd: mỹ phẩm, F&B, thời trang…)

**Cách thu thập** — quan trọng, quyết định độ khả thi:

- **Thủ công có hỗ trợ (đề xuất cho MVP):** 1–2 người "trend scout" dán link TikTok vào web → web tự lấy thumbnail, caption, nhạc, lượt xem → scout gắn tag + ghi chú "cách làm". Mỗi ngày 5–10 trend chất lượng. _Rẻ, chắc chắn, dữ liệu sạch._
- **Tự động (giai đoạn sau):** dùng dịch vụ dữ liệu bên thứ ba (TikTok Creative Center, API trả phí) chạy cron hằng ngày. _Tốn phí, dễ gãy khi TikTok đổi cấu trúc._
- **Kết hợp AI:** AI tóm tắt & phân loại trend từ link scout dán vào.

> 💡 Khuyến nghị: định nghĩa trend là **"Trend edit CapCut trên TikTok VN, trong các ngách agency đang phục vụ"**, thu thập theo kiểu thủ công có hỗ trợ, mỗi trend gắn được với 1 bài Skill (trend → cách làm). Đây là điểm khác biệt khiến web thực sự hữu dụng cho team.

### C. Quản lý Creator

**Chỗ mơ hồ lớn nhất:** "Creator" ở đây là ai?

- Editor trong team (người edit video cho khách)?
- KOC/creator có kênh TikTok riêng, đăng video theo mẫu của agency?
- Hay cả hai?

"Thông tin tổng realtime" có thể là:

- **Số liệu kênh TikTok** (follower, view, like từng video) → phải kéo từ TikTok định kỳ (không thật sự realtime, thường 15 phút – vài giờ/lần)
- **Trạng thái công việc** (mẫu nào đã nhận, đang làm, đã đăng, link bài đăng) → realtime thật được, vì dữ liệu nằm trong web của mình
- **Thu nhập / KPI / hoa hồng** của từng creator?

### D. Tải TikTok không logo

**Khả thi về kỹ thuật:** có (giống SnapTik/SSSTik), hỗ trợ cả video và slideshow ảnh.

**⚠️ Rủi ro cần biết trước:**

- Vi phạm Điều khoản TikTok; TikTok đổi cấu trúc thường xuyên → tính năng hay gãy, cần bảo trì.
- Server bị TikTok chặn IP nếu tải nhiều → có thể cần proxy hoặc dịch vụ bên thứ ba (tốn phí).
- Bản quyền nội dung: nên quy định chỉ dùng để tham khảo/phân tích hoặc với video của chính team/khách hàng.

**Đề xuất:** chỉ cho thành viên đã đăng nhập dùng, giới hạn lượt/ngày, ghi log ai tải gì; có lựa chọn kỹ thuật "tự viết" vs "gọi API bên thứ ba".

### 0. Nền tảng — phân quyền đề xuất

| Vai trò                        | Quyền                                                                |
| ------------------------------ | -------------------------------------------------------------------- |
| **Owner**                      | Mọi thứ, quản lý admin, cài đặt hệ thống                             |
| **Admin**                      | Duyệt/đăng Skill & Trend, quản lý creator, xem báo cáo               |
| **Trend Scout / Editor chính** | Đăng trend, viết bài skill (chờ duyệt)                               |
| **Creator / Thành viên**       | Xem thư viện, nhận mẫu, cập nhật bài đăng của mình, dùng công cụ tải |

---

## 3. Đề xuất công nghệ sơ bộ (chờ bạn xác nhận)

| Lớp                                   | Đề xuất                                    | Lý do                                                                            |
| ------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| Frontend + Backend                    | **Next.js (TypeScript)**                   | 1 codebase cho cả web và API, phổ biến, dễ thuê người tiếp                       |
| Database + Auth + Realtime + Lưu file | **Supabase** (Postgres)                    | Có sẵn đăng nhập, realtime, phân quyền theo dòng (RLS), gói free đủ cho team nhỏ |
| UI                                    | Tailwind CSS + shadcn/ui                   | Dễ khóa design token, đồng bộ                                                    |
| Hosting                               | Vercel (web) + Supabase cloud              | Free/rẻ khi bắt đầu, deploy 1 click                                              |
| Tải TikTok                            | Worker riêng (VPS nhỏ hoặc API bên thứ ba) | Tách rủi ro bị chặn khỏi web chính                                               |
| Validation chung FE↔BE                | **Zod** schema dùng chung                  | Đây là cách "khóa quy ước chặt chẽ" từ frontend tới backend                      |

---

## 4. Danh sách câu hỏi cho bạn

Bạn trả lời theo số là được, không cần trả lời hết một lần. Câu có ⭐ là quan trọng nhất.

### Về team & người dùng

1. ⭐ Team hiện có bao nhiêu người? Dự kiến 6–12 tháng tới bao nhiêu?
2. Tài khoản do admin cấp hay ai cũng tự đăng ký được (rồi admin duyệt)?
3. Thành viên chủ yếu dùng điện thoại hay máy tính?
4. Web chỉ nội bộ hay có phần công khai (giới thiệu agency, nhận khách)?

### Về Thư viện Skill

5. Hiện đã có sẵn bao nhiêu video mẫu/hướng dẫn? Đang lưu ở đâu (Drive, TikTok, YouTube…)?
6. ⭐ Video muốn upload thẳng lên web hay nhúng từ TikTok/YouTube?
7. Có cần lộ trình học (level 1 → 2 → 3) và theo dõi ai đã học gì không?

### Về Xu hướng

8. ⭐ Chọn loại trend muốn theo dõi (xem mục 2.B).
9. Ai sẽ là người cập nhật trend mỗi ngày? Có người chuyên làm việc này không?
10. Agency đang phục vụ những ngách khách hàng nào?

### Về Creator

11. ⭐ "Creator" là editor trong team, KOC có kênh riêng, hay cả hai?
12. ⭐ Muốn theo dõi những số liệu nào? (view/follower TikTok, trạng thái công việc, KPI, thu nhập…)
13. "Mẫu đăng" là gì cụ thể — mẫu video agency giao cho creator làm theo? Có quy trình giao → làm → duyệt → đăng không?
14. Mỗi creator có bao nhiêu kênh TikTok?

### Về tải TikTok

15. Mục đích chính khi tải: lấy nguyên liệu edit, lưu mẫu tham khảo, hay tải lại video của khách/của team?
16. Chấp nhận trả phí API bên thứ ba (~vài trăm nghìn/tháng) để ổn định hơn không?

### Về thiết kế (để khóa design system)

17. ⭐ Đã có logo / màu thương hiệu của Quang Phúc Team chưa? Nếu có gửi mình.
18. Thích phong cách nào: tối (dark, kiểu app edit video) hay sáng? Hiện đại tối giản hay năng động nhiều màu?
19. Có website nào bạn thấy đẹp muốn tham khảo không?

### Về ngân sách & vận hành

20. ⭐ Ngân sách hàng tháng cho hosting/dịch vụ? Muốn bắt đầu free trước không?
21. Ai sẽ build: bạn tự code cùng mình, hay có dev? Bạn biết lập trình ở mức nào?
22. Đã có tên miền chưa?
23. Muốn có bản dùng được đầu tiên trong bao lâu?

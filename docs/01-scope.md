# 01 — Phạm vi dự án (Scope) — ĐÃ CHỐT v1

> Cập nhật: 2026-11-21 · Trạng thái: **Chốt v1** (các mục đánh dấu 🟡 là mặc định Claude đề xuất, chờ bạn xác nhận)

## 1. Định nghĩa sản phẩm (1 câu)

**Web Quang Phúc Team** là app web nội bộ, ưu tiên điện thoại, giúp ~20 (→100) editor CapCut của team **học skill theo lộ trình**, **bắt trend edit + nhạc TikTok mỗi ngày**, **tải video/ảnh TikTok không logo**; và giúp admin **quản lý thành viên** trên cùng một nơi.

## 2. Người dùng

| Chỉ số         | Giá trị                                                                          |
| -------------- | -------------------------------------------------------------------------------- |
| Hiện tại       | 20 người                                                                         |
| 6–12 tháng     | ~100 người                                                                       |
| Thiết bị chính | **Điện thoại** → thiết kế mobile-first, desktop là phụ (admin hay dùng máy tính) |
| Truy cập       | **Chỉ nội bộ.** Không có trang công khai, không tự đăng ký. Admin tạo tài khoản. |

## 3. Vai trò & quyền (khóa)

| Quyền \ Vai trò                                 | `owner` | `admin` | `member` |
| ----------------------------------------------- | :-----: | :-----: | :------: |
| Xem Thư viện Skill, Trend, dùng Tải TikTok      |   ✅    |   ✅    |    ✅    |
| Đánh dấu bài đã học, lưu bài, làm theo lộ trình |   ✅    |   ✅    |    ✅    |
| Sửa hồ sơ cá nhân của mình                      |   ✅    |   ✅    |    ✅    |
| Đăng / sửa / xóa bài Skill, upload tài liệu     |   ✅    |   ✅    |    ❌    |
| Duyệt / ẩn / ghim Trend                         |   ✅    |   ✅    |    ❌    |
| Tạo / khóa / reset mật khẩu tài khoản member    |   ✅    |   ✅    |    ❌    |
| Xem tiến độ học + log tải của mọi người         |   ✅    |   ✅    |    ❌    |
| Tạo / xóa admin, cài đặt hệ thống               |   ✅    |   ❌    |    ❌    |

> Chỉ 3 vai trò. Không thêm vai trò mới khi chưa sửa tài liệu này.

## 4. Các module trong MVP

### M1. Nền tảng (Auth + Admin panel)

- Đăng nhập bằng **tên đăng nhập + mật khẩu** (admin cấp). Lần đầu đăng nhập bắt buộc đổi mật khẩu.
- Admin: tạo tài khoản, khóa/mở khóa, reset mật khẩu, đổi vai trò.
- Thông báo trong app (chuông): có bài skill mới, trend mới nổi bật.
- Cài được lên màn hình điện thoại như app (PWA).

### M2. Quản lý thành viên (Creator = editor trong team)

Hồ sơ **cơ bản**:

- Họ tên, ảnh đại diện, tên đăng nhập, số điện thoại, ngày vào team, trạng thái (đang làm / tạm nghỉ / đã nghỉ)
- **Kênh TikTok: 0 → nhiều kênh** (link + @username) — vì chưa biết mỗi người có bao nhiêu kênh
- Level hiện tại (tự tính theo lộ trình học), số bài đã học
- Ghi chú nội bộ (chỉ admin thấy)

**Realtime:** danh sách thành viên, trạng thái online, tiến độ học cập nhật ngay không cần F5.

🟡 **"Mẫu đăng"**: chưa đưa vào MVP — xem giải thích ở cuối, chờ bạn xác nhận.

### M3. Thư viện Skill + Lộ trình học

- Bài Skill: tiêu đề, ảnh bìa, **video kết quả**, mô tả, các bước (mỗi bước: chữ + ảnh/clip), độ khó, tag, link template CapCut, file đính kèm (font, preset, nhạc…)
- **Admin upload tài liệu** trực tiếp (video, ảnh, file).
- 🟡 Video: hỗ trợ **cả 2 cách** — upload file (clip ngắn ≤ 200MB) **hoặc** dán link YouTube/TikTok để nhúng (video dài).
- **Lộ trình học:** Level 1 → 2 → 3 (admin xếp bài vào level). Học đủ bài bắt buộc của level → mở level tiếp theo.
- Member: đánh dấu "Đã học", lưu bài, xem tiến độ bản thân.
- Admin: bảng tiến độ học của cả team (ai học tới đâu).

### M4. Radar Xu hướng (tự động quét)

Chỉ 2 loại trend:

1. **Trend edit CapCut** — video TikTok dùng template/hiệu ứng CapCut đang lên nhanh
2. **Trend âm thanh/nhạc** — sound TikTok đang lên tại Việt Nam

Cách hoạt động:

- **Bộ quét tự động** chạy hằng ngày (mặc định 06:00 và 18:00) lấy dữ liệu từ nguồn bên ngoài → chấm điểm "độ nóng" (tốc độ tăng view) → lưu vào hàng chờ.
- 🟡 **Admin duyệt nhanh** trước khi hiện cho member (bấm ✅/❌) — tránh rác. Có thể bật chế độ "tự đăng không cần duyệt".
- Mỗi trend: video/sound, thumbnail, lượt xem, tốc độ tăng, ngày phát hiện, tag; admin có thể **gắn bài Skill "cách làm"**.
- Member: xem feed trend hôm nay / tuần này, lọc theo loại, lưu trend, tải video trend (dùng M5).
- Admin vẫn có nút **"Thêm trend thủ công"** bằng link — dự phòng khi nguồn tự động lỗi.

### M5. Tải TikTok không logo

- Dán link → xem trước → tải **video không logo (MP4)**, **ảnh slideshow (từng ảnh / zip)**, **âm thanh (MP3)**.
- Chỉ người đã đăng nhập. **Không giới hạn số lượt** (quyết định 2026-11-22, chủ team chọn để team tải thoải mái). Tải được video, nhạc, từng ảnh và tải cả bài ảnh (slideshow) dưới dạng ZIP.
- Lịch sử tải của mình; admin xem log toàn team.
- Dùng nguồn **miễn phí** trước; thiết kế sẵn để đổi sang API trả phí sau mà không sửa giao diện.

## 5. KHÔNG làm trong MVP (để tránh phình)

- ❌ Trang công khai / giới thiệu agency / nhận khách
- ❌ Tự đăng ký tài khoản, đăng nhập Google/Facebook
- ❌ Kéo số liệu kênh TikTok của thành viên (follower/view) — để giai đoạn 2
- ❌ Quản lý công việc, KPI, lương, thu nhập
- ❌ Chat nội bộ
- ❌ Trend hashtag, trend format nội dung
- ❌ Giao diện tối (dark mode), đa ngôn ngữ — chỉ tiếng Việt, giao diện sáng
- ❌ API trả phí cho tải TikTok / quét trend (thiết kế sẵn, chưa bật)
- ❌ App native iOS/Android (dùng PWA thay thế)

## 6. Ràng buộc

| Ràng buộc   | Giá trị                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------- |
| Chi phí     | **0đ** giai đoạn đầu                                                                         |
| Môi trường  | Chạy **localhost** trước; deploy sau (chưa có tên miền)                                      |
| Người build | Bạn (hiểu code) + Claude                                                                     |
| Thời gian   | Càng sớm càng tốt → MVP chia 6 sprint nhỏ, mỗi sprint ra bản dùng được (xem `05-roadmap.md`) |

## 7. Tiêu chí thành công của MVP

1. 20 thành viên đăng nhập và dùng được trên điện thoại.
2. Admin đăng được 1 bài skill có video trong < 5 phút.
3. Mỗi sáng có ≥ 5 trend mới trong hàng chờ mà không ai phải đi tìm.
4. Tải 1 video TikTok không logo trong < 10 giây.
5. Admin nhìn 1 màn hình là biết ai đang học tới đâu.

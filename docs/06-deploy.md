# 06 — Hướng dẫn triển khai (deploy)

> Cập nhật: 2026-11-22 · Mục tiêu: đưa web lên internet, chi phí 0đ giai đoạn đầu, có tên miền sau.

## 1. Kiến trúc khi deploy

| Thành phần                         | Dịch vụ (free)                                 | Ghi chú                                       |
| ---------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| Web (Next.js)                      | **Vercel** Hobby                               | Tự build khi push lên GitHub                  |
| Database (PostgreSQL)              | **Neon** hoặc **Supabase**                     | Lấy chuỗi `DB_URL`                            |
| File upload (ảnh, video, tài liệu) | Ổ đĩa local (dev) → **Cloudflare R2**          | Cần sửa `lib/storage` khi chuyển (xem mục 5)  |
| Worker quét trend                  | **Render** hoặc máy cá nhân chạy `pnpm worker` | Vercel không chạy được tiến trình nền lâu dài |

## 2. Trước khi deploy

- [ ] Gộp các nhánh `feat/sprint-*` vào `main` (chỉ làm khi bạn đồng ý).
- [ ] Tạo tài khoản GitHub, đẩy code lên một repository **riêng tư** (private).
- [ ] Tạo chuỗi bí mật mới cho `BETTER_AUTH_SECRET` (không dùng lại giá trị trong máy local):
  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
  ```
- [ ] Không bao giờ commit file `.env` (đã nằm trong `.gitignore`).

## 3. Tạo database

1. Đăng ký **Neon** (https://neon.tech), tạo project mới.
2. Copy chuỗi kết nối dạng `postgres://...?sslmode=require`.
3. Trên máy bạn, chạy migration vào database đó (tạm đổi `DB_URL` trong `.env` sang chuỗi của Neon):
   ```powershell
   pnpm db:migrate
   pnpm seed
   ```
   Sau đó đổi `DB_URL` trở lại database local nếu vẫn muốn làm việc local.

## 4. Deploy web lên Vercel

1. Đăng ký **Vercel** bằng tài khoản GitHub, chọn **Add New → Project**, chọn repository.
2. Framework: **Next.js** (tự nhận). Build command giữ mặc định.
3. Thêm biến môi trường (Settings → Environment Variables):

   | Tên                  | Giá trị                                                |
   | -------------------- | ------------------------------------------------------ |
   | `DB_URL`             | Chuỗi kết nối Neon                                     |
   | `BETTER_AUTH_SECRET` | Chuỗi bí mật mới (mục 2)                               |
   | `BETTER_AUTH_URL`    | `https://<tên-dự-án>.vercel.app` (hoặc tên miền riêng) |
   | `STORAGE_DRIVER`     | `local` (tạm)                                          |
   | `TIKTOK_PROVIDER`    | `free`                                                 |

4. Bấm **Deploy**. Sau khi xong, mở địa chỉ `https://...vercel.app` để kiểm tra.
5. Vercel có thể yêu cầu cài đặt Node 24 LTS; chọn trong Settings → General → Node.js Version nếu cần.

> Lưu ý: trên Vercel, thư mục `storage/` là tạm thời, file upload sẽ mất khi hệ thống khởi động lại. Vì vậy cần chuyển sang R2 trước khi dùng thật (mục 5).

## 5. Chuyển file upload sang Cloudflare R2 (cần làm trước khi dùng thật)

1. Tạo tài khoản Cloudflare, bật **R2**, tạo bucket `qpteam-files`, tạo API token có quyền đọc/ghi bucket.
2. Thêm nhánh `r2` cho `lib/storage.ts` (dùng `@aws-sdk/client-s3`, tương thích S3). Route `/api/files/[id]` giữ nguyên, chỉ đổi cách đọc file.
3. Thêm biến `R2_*` vào Vercel và đặt `STORAGE_DRIVER=r2`.

Đây là việc riêng, nên làm ở một phiên sau khi bạn đã chọn dịch vụ và có tài khoản Cloudflare.

## 6. Worker quét trend

Vercel không chạy được tiến trình nền. Có hai lựa chọn:

- **Máy cá nhân:** để terminal chạy `pnpm worker` khi cần quét. Đơn giản nhất, nhưng máy phải bật.
- **Render (free):** tạo **Background Worker** từ repository, lệnh chạy `pnpm worker`, thêm cùng các biến môi trường như Vercel.

Hiện chưa có nguồn quét tự động nào được bật (xem `docs/05-roadmap.md`, Sprint 5), nên worker chưa cần thiết cho đến khi chọn nguồn.

## 7. Tên miền riêng (sau này)

1. Mua tên miền (tại một nhà cung cấp tên miền Việt Nam, hoặc Cloudflare Registrar).
2. Vercel → Settings → Domains → thêm tên miền, làm theo hướng dẫn DNS.
3. Đổi `BETTER_AUTH_URL` sang tên miền mới rồi deploy lại.

## 8. Kiểm tra sau deploy

- [ ] Đăng nhập bằng tài khoản owner, đổi mật khẩu lần đầu được.
- [ ] Mở trang trên điện thoại (không cần cùng wifi), cài lên màn hình chính được.
- [ ] Tạo bài học, tải ảnh, xem video trên điện thoại.
- [ ] Thêm trend bằng link, duyệt, xem trên trang Trend.
- [ ] Tải một video TikTok (nếu nguồn đang hoạt động).

## 9. Cập nhật sau này

Mỗi lần đẩy code lên `main`, Vercel tự build và deploy. Nếu có thay đổi database, chạy `pnpm db:migrate` với `DB_URL` của Neon trước khi deploy.

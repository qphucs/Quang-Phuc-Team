# 03 — Quy ước chung Frontend ↔ Backend — 🔒 KHÓA v1

> Cập nhật: 2026-11-21 · Áp dụng cho mọi dòng code. Code vi phạm = phải sửa trước khi merge.

## 1. Nguyên tắc vàng

1. **Một nguồn sự thật cho mọi thứ.**
   - Cấu trúc dữ liệu: `src/db/schema.ts` (Drizzle) → sinh ra Zod schema → sinh ra kiểu TypeScript. FE và BE dùng chung, **không ai tự viết lại kiểu dữ liệu bằng tay**.
   - Giao diện: `src/styles/tokens.css` (xem `02-design-system.md`).
   - Quyền: `src/lib/permissions.ts`.
   - Chữ hiển thị cố định: `src/lib/copy.ts`.
2. **Kiểm tra dữ liệu ở cả 2 đầu bằng cùng 1 Zod schema.** Form kiểm tra để báo lỗi nhanh; server kiểm tra lại vì không tin client.
3. **Kiểm tra quyền ở server, mọi lúc.** Ẩn nút trên giao diện chỉ là phụ.
4. **TypeScript `strict`, cấm `any`.** Dữ liệu chưa rõ dùng `unknown` rồi parse bằng Zod.

## 2. Công nghệ (khóa — không thêm thư viện khi chưa ghi vào đây)

| Việc                          | Chọn                                                                               | Lý do                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Ngôn ngữ                      | **TypeScript** (strict)                                                            | Một ngôn ngữ cho cả FE và BE                                 |
| Framework                     | **Next.js** (App Router)                                                           | Web + API chung 1 project                                    |
| Gói quản lý                   | **pnpm**                                                                           | Nhanh, chặt chẽ                                              |
| CSDL                          | **PostgreSQL**                                                                     | Ổn định, free ở mọi nhà cung cấp                             |
| ORM                           | **Drizzle ORM** + `drizzle-zod`                                                    | Schema viết bằng TS, tự sinh Zod schema → khóa kiểu FE↔BE    |
| Kiểm tra dữ liệu              | **Zod**                                                                            | Dùng chung FE/BE                                             |
| Đăng nhập                     | **Better Auth** (username + password, plugin admin)                                | Có sẵn tạo user, khóa user, phân quyền                       |
| Giao diện                     | **Tailwind CSS v4** + **shadcn/ui** + **Lucide**                                   | Khóa token dễ, component đẹp sẵn                             |
| Nền của shadcn/ui             | `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `sonner` (toast) | Đi kèm shadcn/ui, không dùng trực tiếp ngoài `components/ui` |
| Font                          | `next/font/google` (Be Vietnam Pro)                                                | Tải lúc build rồi tự host, không gọi Google lúc chạy         |
| Chạy script TS (seed, worker) | **tsx** + `--env-file` của Node                                                    | Không cần thư viện dotenv                                    |
| Form                          | **React Hook Form** + Zod resolver                                                 |                                                              |
| Lấy dữ liệu phía client       | **TanStack Query**                                                                 | Cache, tải lại, đồng bộ realtime                             |
| Realtime                      | **Server-Sent Events** + Postgres `LISTEN/NOTIFY`                                  | Free, không cần dịch vụ ngoài                                |
| Lịch chạy (quét trend)        | **node-cron** trong tiến trình worker riêng                                        |                                                              |
| Lưu file                      | Ổ đĩa local (dev) → **Cloudflare R2** (khi deploy, free 10GB)                      | Qua 1 lớp `storage` chung                                    |
| Xử lý video/ảnh               | **ffmpeg** (tạo thumbnail), **sharp** (nén ảnh)                                    |                                                              |
| Ngày giờ                      | **date-fns** + `date-fns-tz`                                                       |                                                              |
| Kiểm thử                      | **Vitest** (logic) · **Playwright** (luồng chính)                                  |                                                              |
| Chất lượng code               | **ESLint** + **Prettier** + **Husky** (chạy trước commit)                          |                                                              |

## 3. Cấu trúc thư mục (theo tính năng)

```
web-quang-phuc-team/
├─ docs/                      # Tài liệu này
├─ src/
│  ├─ app/                    # Route Next.js
│  │  ├─ (auth)/dang-nhap/
│  │  ├─ (app)/               # Cần đăng nhập, có bottom nav
│  │  │  ├─ page.tsx          # Trang chủ
│  │  │  ├─ hoc/              # Thư viện skill + lộ trình
│  │  │  ├─ trend/
│  │  │  ├─ tai/              # Tải TikTok
│  │  │  └─ toi/              # Hồ sơ cá nhân
│  │  ├─ (admin)/quan-tri/    # Chỉ owner/admin
│  │  └─ api/                 # Route handler (SSE, upload, webhook)
│  ├─ features/               # MỖI TÍNH NĂNG 1 THƯ MỤC
│  │  ├─ members/
│  │  │  ├─ components/       # UI riêng của tính năng
│  │  │  ├─ actions.ts        # Server Actions (ghi dữ liệu)
│  │  │  ├─ queries.ts        # Hàm đọc dữ liệu (chạy ở server)
│  │  │  ├─ schemas.ts        # Zod schema của tính năng
│  │  │  └─ hooks.ts          # Hook client (TanStack Query)
│  │  ├─ skills/
│  │  ├─ learning/
│  │  ├─ trends/
│  │  ├─ downloader/
│  │  └─ notifications/
│  ├─ components/ui/          # Component dùng chung (shadcn đã chỉnh token)
│  ├─ db/
│  │  ├─ schema.ts            # 🔒 Nguồn sự thật về dữ liệu
│  │  ├─ index.ts             # Kết nối DB
│  │  └─ migrations/          # Sinh tự động, không sửa tay
│  ├─ lib/
│  │  ├─ auth.ts              # Cấu hình Better Auth
│  │  ├─ permissions.ts       # 🔒 Ma trận quyền
│  │  ├─ action.ts            # Wrapper chuẩn cho Server Action
│  │  ├─ errors.ts            # 🔒 Mã lỗi
│  │  ├─ storage/             # Lưu file: local | r2
│  │  ├─ realtime.ts          # Phát/nhận sự kiện
│  │  ├─ format.ts            # Định dạng ngày, số (theo 02-design-system mục 8)
│  │  └─ copy.ts              # Chữ hiển thị dùng chung
│  └─ styles/tokens.css       # 🔒 Design token
├─ worker/                    # Tiến trình nền: quét trend, xử lý video
│  ├─ index.ts
│  └─ trend-sources/          # Mỗi nguồn dữ liệu 1 file (adapter)
├─ storage/                   # File upload khi chạy local (không commit)
├─ .env.example
└─ CLAUDE.md
```

**Luật import:** `features/A` **không được** import từ `features/B`. Thứ dùng chung đưa lên `lib/` hoặc `components/ui/`.

## 4. Đặt tên

| Thứ               | Quy ước                                      | Ví dụ                                         |
| ----------------- | -------------------------------------------- | --------------------------------------------- |
| File component    | `kebab-case.tsx`                             | `skill-card.tsx`                              |
| Tên component     | `PascalCase`                                 | `SkillCard`                                   |
| Biến, hàm         | `camelCase`                                  | `getSkillById`                                |
| Hằng số           | `SCREAMING_SNAKE_CASE`                       | `MAX_UPLOAD_MB`                               |
| Kiểu / Zod schema | `PascalCase` / `camelCase` + `Schema`        | `Skill` / `skillCreateSchema`                 |
| Bảng DB           | `snake_case`, **số nhiều**                   | `skills`, `learning_progress`                 |
| Cột DB            | `snake_case`                                 | `created_at`, `tiktok_username`               |
| Field trong TS    | `camelCase` (Drizzle tự map)                 | `createdAt`                                   |
| Enum DB           | `snake_case`, giá trị `snake_case` tiếng Anh | `trend_type: capcut_edit \| sound`            |
| URL trang         | **tiếng Việt không dấu**, `kebab-case`       | `/hoc/bai/chuyen-canh-zoom`                   |
| API route         | tiếng Anh, `kebab-case`, số nhiều            | `/api/trends`, `/api/downloads`               |
| Server Action     | động từ + danh từ                            | `createSkill`, `approveTrend`                 |
| Sự kiện realtime  | `danh-tu.dong-tu`                            | `member.updated`, `trend.approved`            |
| Biến môi trường   | `SCREAMING_SNAKE_CASE`, có tiền tố nhóm      | `DB_URL`, `STORAGE_DRIVER`, `TIKTOK_PROVIDER` |

**Code, tên biến, comment kỹ thuật: tiếng Anh. Chữ hiển thị cho người dùng: tiếng Việt.**

## 5. Cơ sở dữ liệu

- Khóa chính: `id uuid` (v4 — `gen_random_uuid()` ở DB / `crypto.randomUUID()` ở code; Better Auth cấu hình sinh uuid). Sắp xếp theo `created_at`, không dựa vào id.
- Bảng nào cũng có: `created_at`, `updated_at` (`timestamptz`, mặc định `now()`).
- Xóa mềm cho dữ liệu nội dung (`skills`, `trends`, `users`): cột `deleted_at`. Log tải thì xóa cứng sau 90 ngày.
- **Lưu thời gian bằng UTC**, chỉ đổi sang GMT+7 khi hiển thị.
- Tiền tệ (nếu sau này có): số nguyên đơn vị VNĐ, không dùng số thực.
- Đổi cấu trúc DB **chỉ qua migration** (`pnpm db:generate` → `pnpm db:migrate`). Không sửa DB bằng tay.
- Mọi khóa ngoại có index. Cột hay lọc/sắp xếp có index.

## 6. Giao tiếp FE ↔ BE

### 6.1 Chọn cách nào

| Việc                                                   | Dùng                                         |
| ------------------------------------------------------ | -------------------------------------------- |
| Đọc dữ liệu để hiện trang                              | **Server Component** gọi thẳng `queries.ts`  |
| Ghi dữ liệu từ form/nút                                | **Server Action** (bọc bằng `lib/action.ts`) |
| Upload file lớn, SSE realtime, tải file, gọi từ worker | **Route Handler** `/api/...`                 |

### 6.2 Hình dạng kết quả (khóa)

Mọi Server Action và API trả về **đúng 1 trong 2 dạng**:

```ts
type Result<T> =
  { ok: true; data: T } | { ok: false; error: { code: ErrorCode; message: string; fields?: Record<string, string> } };
```

- `code`: mã lỗi máy đọc (bảng dưới). `message`: câu tiếng Việt hiển thị được luôn. `fields`: lỗi theo từng ô form.
- Không bao giờ ném lỗi thô (stack trace, lỗi SQL) ra client.

### 6.3 Mã lỗi (khóa — `src/lib/errors.ts`)

| Mã                 | HTTP | Khi nào                               |
| ------------------ | ---- | ------------------------------------- |
| `VALIDATION_ERROR` | 400  | Dữ liệu không qua Zod                 |
| `UNAUTHENTICATED`  | 401  | Chưa đăng nhập / hết phiên            |
| `FORBIDDEN`        | 403  | Không đủ quyền                        |
| `NOT_FOUND`        | 404  | Không tìm thấy                        |
| `CONFLICT`         | 409  | Trùng (vd: tên đăng nhập đã có)       |
| `RATE_LIMITED`     | 429  | Vượt giới hạn (vd: 50 lượt tải/ngày)  |
| `UPSTREAM_ERROR`   | 502  | Nguồn ngoài lỗi (TikTok, nguồn trend) |
| `INTERNAL_ERROR`   | 500  | Lỗi khác (ghi log đầy đủ ở server)    |

### 6.4 Danh sách & phân trang

- Phân trang **cursor** (cuộn vô hạn trên mobile): `?cursor=<id>&limit=20`. `limit` tối đa 50.
- Trả về `{ items: T[], nextCursor: string | null }`.

### 6.5 Mẫu Server Action chuẩn

```ts
// features/skills/actions.ts
export const createSkill = action({
  schema: skillCreateSchema, // Zod — cũng dùng ở form
  permission: "skill:write", // tra trong lib/permissions.ts
  handler: async (input, { user }) => {
    const skill = await db
      .insert(skills)
      .values({ ...input, authorId: user.id })
      .returning();
    await emit("skill.created", { id: skill[0].id }); // realtime
    return skill[0];
  },
});
```

Wrapper `action()` tự làm: kiểm tra đăng nhập → kiểm tra quyền → parse Zod → bắt lỗi → trả `Result<T>`.

## 7. Phân quyền

- Quyền đặt tên `tai-nguyen:hanh-dong`: `skill:read`, `skill:write`, `trend:approve`, `member:manage`, `download:use`, `download:view_all`, `admin:manage`, `system:settings`.
- `src/lib/permissions.ts` là bảng `role → permissions[]` theo đúng ma trận ở `01-scope.md` mục 3.
- Giao diện ẩn/hiện theo `can(user, "skill:write")`; server **luôn** kiểm tra lại.

## 8. Realtime

- Client mở 1 kết nối SSE duy nhất: `GET /api/events`.
- Server phát sự kiện dạng `{ type: "member.updated", payload: { id } }` — **chỉ gửi id, không gửi dữ liệu nhạy cảm**; client nhận rồi gọi TanStack Query tải lại phần liên quan.
- Danh sách sự kiện khóa trong `src/lib/realtime.ts`. Thêm sự kiện = thêm vào danh sách đó.

## 9. Upload file

| Loại     | Định dạng          | Tối đa                          |
| -------- | ------------------ | ------------------------------- |
| Ảnh      | jpg, png, webp     | 10 MB (tự nén về webp ≤ 1600px) |
| Video    | mp4, mov           | 200 MB (tự tạo thumbnail)       |
| Tài liệu | pdf, zip, ttf, otf | 50 MB                           |

- Kiểm tra cả đuôi file **và** nội dung thật (magic bytes).
- Tên file lưu: `<loai>/<yyyy>/<mm>/<uuid>.<ext>`. Không giữ tên gốc trong đường dẫn.
- Mọi file đi qua `lib/storage` → đổi local ↔ R2 chỉ bằng biến `STORAGE_DRIVER`.

## 10. Bảo mật

- Mật khẩu: tối thiểu 8 ký tự; hash do Better Auth xử lý. Lần đầu đăng nhập bắt buộc đổi.
- Khóa đăng nhập 15 phút sau 5 lần sai.
- Phiên đăng nhập: cookie `httpOnly`, `secure`, `sameSite=lax`, hạn 30 ngày.
- Bí mật chỉ nằm trong `.env` (không commit). `.env.example` liệt kê đủ tên biến.
- Ghi log hành động admin: ai, làm gì, lúc nào (bảng `audit_logs`).

## 11. Git & quy trình

- Nhánh: `main` (luôn chạy được) · `feat/<ten>` · `fix/<ten>`.
- Commit theo Conventional Commits: `feat(skills): them lo trinh hoc`, `fix(downloader): ...`.
- Trước commit tự chạy: lint + typecheck + format.
- Mỗi sprint kết thúc bằng 1 tag: `v0.1.0`, `v0.2.0`…

## 12. Định nghĩa "XONG" cho mỗi tính năng

- [ ] Chạy đúng trên màn 375px và 1280px
- [ ] Theo đúng token, không có mã hex/màu lạ
- [ ] Có trạng thái: đang tải (skeleton), rỗng, lỗi
- [ ] Server kiểm tra quyền + Zod
- [ ] Không có lỗi TypeScript/ESLint
- [ ] Luồng chính có test (Vitest/Playwright)

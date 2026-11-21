# 02 — Design System — 🔒 KHÓA v1

> Cập nhật: 2026-11-21 · Mọi màn hình, component, email, ảnh xuất ra đều phải theo file này.
> Muốn đổi bất kỳ giá trị nào → sửa file này trước (tăng version), rồi mới sửa code.

## 0. Nguyên tắc thiết kế

1. **Hiện đại, rõ ràng, tinh tế, tiện ích.** Mỗi màn hình có một việc chính.
2. **Màu phẳng, độc lập.** ❌ Không gradient, ❌ không glow/phát sáng, ❌ không glassmorphism, ❌ không bóng đổ trên card. Tách lớp bằng **viền 1px** và **khoảng trắng**.
3. **Mobile-first.** Thiết kế cho màn 375px trước, rồi mới mở rộng lên desktop.
4. **Nội dung là nhân vật chính.** Video/ảnh nổi bật, giao diện lùi về sau.
5. **Một cách làm cho một việc.** Không tạo biến thể component mới khi đã có sẵn.

---

## 1. Màu sắc

### 1.1 Màu thương hiệu (do bạn cung cấp — khóa)

| Token         | Hex       | Dùng cho                                           |
| ------------- | --------- | -------------------------------------------------- |
| `brand`       | `#1BC8DC` | Nút chính, tab đang chọn, điểm nhấn, thanh tiến độ |
| `bg`          | `#FFFFFF` | Nền chính                                          |
| `brand-tint`  | `#E6F9FD` | Nền phụ: banner, khối nổi bật, trạng thái chọn     |
| `violet-tint` | `#E9E6FB` | Nền nhấn phụ: khối Trend, badge phụ                |
| `ink`         | `#0B0B0F` | Tiêu đề, chữ trên nút brand                        |
| `muted`       | `#7B8794` | Chữ phụ: ngày giờ, chú thích, placeholder          |

### 1.2 Bộ 3 màu nhấn (từ dải gradient icon → **tách thành 3 màu phẳng độc lập**)

Bạn yêu cầu không loang lổ, nên dải `#3DD9F0 → #B57BFF → #F59CD8` **không dùng làm gradient**. Thay vào đó mỗi màu là màu nhận diện của 1 khu vực:

| Token           | Hex       | Khu vực      | Cách dùng               |
| --------------- | --------- | ------------ | ----------------------- |
| `accent-cyan`   | `#3DD9F0` | Học / Skill  | Ô nền icon, tag         |
| `accent-violet` | `#B57BFF` | Trend CapCut | Ô nền icon, tag         |
| `accent-pink`   | `#F59CD8` | Trend Nhạc   | Ô nền icon, tag         |
| `ink`           | `#0B0B0F` | Tải TikTok   | Ô nền icon (icon trắng) |

Ô icon: nền màu nhấn đặc + icon màu `ink`. Không dùng màu nhấn làm màu chữ.

### 1.3 Màu bổ sung bắt buộc (Claude thêm để giao diện chạy được — cùng tông với bộ màu của bạn)

| Token                                      | Hex                               | Lý do cần                                                                |
| ------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------ |
| `body`                                     | `#4A5361`                         | **Chữ nội dung chính.** Xem mục 1.4                                      |
| `brand-ink`                                | `#0A7F8C`                         | Chữ/link màu brand trên nền trắng (cyan gốc quá nhạt để làm chữ)         |
| `pink-tint`                                | `#FDEBF7`                         | Nền badge "Nhạc" (bản nhạt của accent-pink, giống vai trò `violet-tint`) |
| `scrim`                                    | `rgba(11,11,15,0.4)`              | Lớp phủ tối phía sau bottom sheet / dialog                               |
| `line`                                     | `#E7EBEF`                         | Viền card, đường kẻ, viền input                                          |
| `surface`                                  | `#F5F7F9`                         | Nền input, nền khối xám, skeleton                                        |
| `success` / `success-tint` / `success-ink` | `#12B76A` / `#E8F8F0` / `#067647` | Thành công, "Đã học"                                                     |
| `warning` / `warning-tint` / `warning-ink` | `#F79009` / `#FEF4E6` / `#B54708` | Cảnh báo, "Chờ duyệt"                                                    |
| `danger` / `danger-tint` / `danger-ink`    | `#F04438` / `#FEECEB` / `#B42318` | Lỗi, xóa, "Đã khóa"                                                      |

### 1.4 ⚠️ Kiểm tra độ tương phản (đọc được trên điện thoại ngoài trời)

| Cặp màu                          | Tỉ lệ    | Kết luận                                                                     |
| -------------------------------- | -------- | ---------------------------------------------------------------------------- |
| Chữ trắng trên `#1BC8DC`         | 2.0 : 1  | ❌ Không đọc được → **chữ trên nút brand dùng `ink`** (9.7 : 1)              |
| `#1BC8DC` làm chữ trên nền trắng | 2.0 : 1  | ❌ → link/chữ brand dùng `brand-ink #0A7F8C` (4.7 : 1)                       |
| `#7B8794` trên nền trắng         | 3.7 : 1  | ⚠️ Chỉ dùng cho chữ phụ (ngày giờ, placeholder), **không dùng cho đoạn văn** |
| Chữ trắng trên `danger #F04438`  | 3.8 : 1  | ❌ → nút xóa dùng nền `danger-ink #B42318` (6.6 : 1)                         |
| `body #4A5361` trên nền trắng    | 7.8 : 1  | ✅ Dùng cho nội dung đọc dài                                                 |
| `ink #0B0B0F` trên nền trắng     | 19.5 : 1 | ✅ Tiêu đề                                                                   |

### 1.5 Luật dùng màu

- Một màn hình **chỉ có 1 nút `brand`** (hành động chính). Các nút khác dùng kiểu phụ.
- Màu brand chiếm ≤ 10% diện tích màn hình.
- Trạng thái luôn có **icon + chữ**, không chỉ dựa vào màu.
- ❌ Cấm viết mã hex trực tiếp trong component. Chỉ dùng token. (Tailwind được cấu hình **xóa toàn bộ bảng màu mặc định**, nên `bg-blue-500` sẽ không chạy.)

---

## 2. Chữ (Typography)

**Font duy nhất: [Be Vietnam Pro](https://fonts.google.com/specimen/Be+Vietnam+Pro)** — font do người Việt thiết kế, dấu tiếng Việt chuẩn và đẹp, miễn phí. Tải về tự host (`next/font`), không gọi Google lúc chạy.

Độ đậm dùng: **400** (thường), **500** (vừa), **600** (đậm vừa), **700** (đậm). Không dùng độ đậm khác.
Số liệu (lượt xem, thời gian, bảng) bật `font-variant-numeric: tabular-nums`.

| Token     | Cỡ / Line-height | Đậm | Dùng cho                                                                |
| --------- | ---------------- | --- | ----------------------------------------------------------------------- |
| `display` | 30 / 38          | 700 | Tiêu đề trang chủ, số lớn trên dashboard                                |
| `h1`      | 24 / 32          | 700 | Tiêu đề trang                                                           |
| `h2`      | 20 / 28          | 600 | Tiêu đề khu vực                                                         |
| `h3`      | 18 / 26          | 600 | Tiêu đề card                                                            |
| `base`    | 16 / 24          | 400 | Nội dung chính (**không nhỏ hơn 16 trên input** — tránh iPhone tự zoom) |
| `sm`      | 14 / 20          | 400 | Nội dung phụ, mô tả card                                                |

> Cỡ chữ nội dung đặt tên `base`/`sm` (class `text-base`, `text-sm`) để không trùng với màu chữ `body` (class `text-body`).
> | `caption` | 12 / 16 | 500 | Ngày giờ, nhãn nhỏ, badge |
> | `button` | 15 / 20 | 600 | Chữ trên nút |

Letter-spacing: tiêu đề `-0.01em`, còn lại `0`. Không viết HOA toàn bộ (trừ badge rất ngắn).

---

## 3. Khoảng cách, bo góc, viền, bóng

**Lưới 4px.** Chỉ dùng các giá trị: `0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`.

| Hạng mục                     | Giá trị                        |
| ---------------------------- | ------------------------------ |
| Lề 2 bên màn hình            | 16px (mobile) · 24px (≥768px)  |
| Khoảng cách giữa các card    | 12px (mobile) · 16px (desktop) |
| Padding trong card           | 16px                           |
| Khoảng cách giữa các khu vực | 32px                           |

| Bo góc        | Giá trị | Dùng cho                                   |
| ------------- | ------- | ------------------------------------------ |
| `radius-sm`   | 8px     | Nút, input, badge vuông, thumbnail nhỏ     |
| `radius-md`   | 12px    | Card, ảnh/video trong card                 |
| `radius-lg`   | 20px    | Bottom sheet, modal                        |
| `radius-full` | 9999px  | Avatar, tag dạng viên thuốc, nút icon tròn |

| Viền / Bóng    | Giá trị                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Viền mặc định  | `1px solid line`                                                                                                                |
| Viền khi focus | `2px brand` + khoảng hở 2px (focus ring)                                                                                        |
| Bóng           | **Chỉ 1 loại**, chỉ dùng cho lớp nổi (bottom sheet, menu thả, toast): `0 8px 24px rgba(11,11,15,0.08)`. Card **không có bóng**. |

---

## 4. Icon & hình ảnh

- Bộ icon duy nhất: **Lucide**. Cỡ 20px (mặc định), 24px (thanh điều hướng), 16px (trong badge). Nét `1.75`.
- Màu icon: `ink` (chính) hoặc `muted` (phụ). Không tô màu nhấn trừ trong ô icon khu vực.
- ❌ Không dùng emoji trong giao diện.
- Video/ảnh TikTok hiển thị tỉ lệ **9:16**; ảnh bìa bài Skill **16:9**; avatar hình tròn.
- Ảnh luôn có nền `surface` khi đang tải + skeleton.

---

## 5. Bố cục

| Breakpoint | Rộng     | Bố cục                                                         |
| ---------- | -------- | -------------------------------------------------------------- |
| mặc định   | < 768px  | 1 cột, **thanh tab dưới** (bottom nav)                         |
| `md`       | ≥ 768px  | 2 cột lưới card, vẫn bottom nav                                |
| `lg`       | ≥ 1024px | **Sidebar trái 240px** thay bottom nav, nội dung tối đa 1200px |

**Thanh tab dưới (member) — 5 mục, cố định:**
`Trang chủ` · `Học` · `Trend` · `Tải` · `Tôi`
(Admin: thêm mục **Quản trị** trong trang `Tôi` trên mobile; trên desktop là nhóm riêng ở sidebar.)

| Phần tử              | Kích thước                                                  |
| -------------------- | ----------------------------------------------------------- |
| Thanh trên (top bar) | cao 56px, nền trắng, viền dưới `line`                       |
| Thanh tab dưới       | cao 64px + vùng an toàn iPhone, nền trắng, viền trên `line` |
| Vùng chạm tối thiểu  | **44 × 44px**                                               |

---

## 6. Component (danh sách khóa)

Dựng trên **shadcn/ui** rồi chỉnh theo token. Chỉ dùng các biến thể dưới đây.

| Component                     | Biến thể được phép                                                                                                                          | Quy định                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Button**                    | `primary` (nền brand, chữ ink) · `secondary` (nền trắng, viền line, chữ ink) · `ghost` (không nền) · `danger` (nền `danger-ink`, chữ trắng) | Cao: `sm` 36 · `md` 44 · `lg` 52. Icon bên trái chữ. Trạng thái loading: spinner thay icon, giữ nguyên chiều rộng |
| **Input / Textarea / Select** | 1 kiểu                                                                                                                                      | Cao 44, nền `surface`, viền `line`, chữ 16px, nhãn luôn nằm trên ô, lỗi hiện chữ `danger-ink` bên dưới            |
| **Card**                      | `default` · `interactive` (bấm được: nền đổi `surface` khi nhấn)                                                                            | Nền trắng, viền line, bo 12, padding 16                                                                           |
| **Badge / Tag**               | `neutral` · `brand` · `success` · `warning` · `danger` · `violet` · `pink`                                                                  | Nền tint + chữ ink tương ứng, bo full, chữ `caption`                                                              |
| **Avatar**                    | 24 · 32 · 40 · 64                                                                                                                           | Tròn; không có ảnh → chữ cái đầu trên nền `brand-tint`                                                            |
| **Bottom sheet**              | 1 kiểu                                                                                                                                      | Thay cho modal trên mobile. Bo trên 20px, có thanh kéo                                                            |
| **Dialog**                    | 1 kiểu                                                                                                                                      | Chỉ dùng trên desktop và để xác nhận hành động nguy hiểm                                                          |
| **Toast**                     | `success` · `error` · `info`                                                                                                                | Hiện giữa phía trên, tự ẩn sau 4 giây                                                                             |
| **Tabs**                      | `underline`                                                                                                                                 | Gạch chân brand 2px dưới tab đang chọn                                                                            |
| **Progress**                  | thanh · vòng                                                                                                                                | Màu brand trên nền `surface`                                                                                      |
| **Skeleton**                  | —                                                                                                                                           | Nền `surface`, nhấp nháy nhẹ. Luôn dùng khi tải danh sách                                                         |
| **Empty state**               | —                                                                                                                                           | Icon 40px `muted` + 1 câu + (tuỳ chọn) 1 nút                                                                      |
| **Video player**              | 1 kiểu                                                                                                                                      | Tỉ lệ 9:16 hoặc 16:9, bo 12, không tự phát tiếng                                                                  |

---

## 7. Chuyển động

- Thời gian: **150ms** (nhấn, hover) · **200ms** (mở sheet, chuyển tab) · **250ms** (chuyển trang).
- Kiểu: `ease-out`. ❌ Không nảy (bounce), không xoay, không hiệu ứng rườm rà.
- Tôn trọng cài đặt "giảm chuyển động" của máy → tắt hết animation.

---

## 8. Giọng văn & định dạng

- Tiếng Việt, ngắn gọn, xưng **"bạn"**. Thân thiện nhưng không suồng sã.
- Chữ trên nút = **động từ + đối tượng**: "Tải video", "Lưu bài", "Tạo tài khoản". Không dùng "OK", "Submit".
- Thông báo lỗi nói **chuyện gì xảy ra + làm gì tiếp**: "Link không hợp lệ. Hãy dán link video TikTok."
- Ngày: `21/11/2026` · Giờ: `14:30` (24h) · Tương đối: "5 phút trước", "Hôm qua".
- Số lớn: `1,2K` · `3,4M` · `1,1B`; số thường dùng dấu chấm ngăn nghìn: `12.500`.
- Múi giờ hiển thị: **Asia/Ho_Chi_Minh (GMT+7)**.

---

## 9. Token dạng code (nguồn sự thật duy nhất)

File `src/styles/tokens.css` — Tailwind v4:

```css
@import "tailwindcss";

@theme {
  /* Xóa sạch bảng màu mặc định của Tailwind → chỉ token dưới đây dùng được */
  --color-*: initial;

  /* Thương hiệu */
  --color-brand: #1bc8dc;
  --color-brand-ink: #0a7f8c;
  --color-brand-tint: #e6f9fd;
  --color-violet-tint: #e9e6fb;
  --color-bg: #ffffff;
  --color-ink: #0b0b0f;
  --color-body: #4a5361;
  --color-muted: #7b8794;
  --color-line: #e7ebef;
  --color-surface: #f5f7f9;
  --color-white: #ffffff;
  --color-transparent: transparent;

  /* Màu nhấn khu vực */
  --color-accent-cyan: #3dd9f0;
  --color-accent-violet: #b57bff;
  --color-accent-pink: #f59cd8;

  /* Trạng thái */
  --color-success: #12b76a;
  --color-success-tint: #e8f8f0;
  --color-success-ink: #067647;
  --color-warning: #f79009;
  --color-warning-tint: #fef4e6;
  --color-warning-ink: #b54708;
  --color-danger: #f04438;
  --color-danger-tint: #feeceb;
  --color-danger-ink: #b42318;

  /* Chữ */
  --font-sans: "Be Vietnam Pro", system-ui, sans-serif;
  --text-display: 30px;
  --text-display--line-height: 38px;
  --text-h1: 24px;
  --text-h1--line-height: 32px;
  --text-h2: 20px;
  --text-h2--line-height: 28px;
  --text-h3: 18px;
  --text-h3--line-height: 26px;
  --text-base: 16px;
  --text-base--line-height: 24px;
  --text-sm: 14px;
  --text-sm--line-height: 20px;
  --text-caption: 12px;
  --text-caption--line-height: 16px;
  --text-button: 15px;
  --text-button--line-height: 20px;

  /* Bo góc */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;

  /* Bóng — duy nhất 1 loại, chỉ cho lớp nổi */
  --shadow-overlay: 0 8px 24px rgba(11, 11, 15, 0.08);

  /* Chuyển động */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

## Lịch sử phiên bản

| Version | Ngày       | Thay đổi                                                                                  |
| ------- | ---------- | ----------------------------------------------------------------------------------------- |
| v1      | 2026-11-21 | Khóa lần đầu theo bảng màu của chủ dự án                                                  |
| v1.1    | 2026-11-21 | Đổi tên cỡ chữ `body`/`body-sm` → `base`/`sm` (tránh trùng màu `body`). Giá trị không đổi |

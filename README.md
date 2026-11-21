# Web Quang Phúc Team

Cổng nội bộ cho team edit CapCut. Tài liệu dự án nằm trong [`docs/`](docs/), luật code trong [`CLAUDE.md`](CLAUDE.md).

## Cài đặt lần đầu (Windows)

### 1. Cài PostgreSQL 17

1. Tải bộ cài tại https://www.postgresql.org/download/windows/ → **Download the installer** (EDB) → bản **17.x Windows x86-64**.
2. Chạy bộ cài, để mặc định các bước. Ở bước **Password**, đặt mật khẩu cho user `postgres` và **ghi nhớ nó**. Port giữ `5432`.
3. Bỏ chọn Stack Builder ở bước cuối.
4. Tạo database `qpteam` — mở **SQL Shell (psql)** từ Start menu, Enter qua các câu hỏi, nhập mật khẩu, rồi gõ:
   ```sql
   CREATE DATABASE qpteam;
   ```

### 2. Cấu hình

Mở file `.env` (đã tạo sẵn), thay `CHANGE_ME` trong `DB_URL` bằng mật khẩu `postgres` bạn vừa đặt.

### 3. Chạy

```powershell
pnpm install
pnpm db:migrate   # tạo bảng
pnpm seed         # tạo tài khoản chủ team, in ra mật khẩu tạm
pnpm dev          # mở http://localhost:3000
```

Mở trên điện thoại (cùng wifi): `http://<IP-máy-tính>:3000` — xem IP bằng lệnh `ipconfig`.

## Lệnh thường dùng

| Lệnh                                         | Việc                                       |
| -------------------------------------------- | ------------------------------------------ |
| `pnpm dev`                                   | Chạy web dev                               |
| `pnpm typecheck` · `pnpm lint` · `pnpm test` | Kiểm tra code                              |
| `pnpm db:generate` → `pnpm db:migrate`       | Sau khi sửa `src/db/schema.ts`             |
| `pnpm db:studio`                             | Xem dữ liệu trong trình duyệt              |
| `/kitchen-sink`                              | Trang soát toàn bộ component (chỉ khi dev) |

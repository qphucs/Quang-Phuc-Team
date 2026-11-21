"use client";
import { CopyButton } from "@/components/ui/copy-button";

/** Shows a temporary password exactly once. The admin copies it and sends it to the member. */
export function CredentialsPanel({ username, tempPassword }: { username: string; tempPassword: string }) {
  const text = `Tên đăng nhập: ${username}\nMật khẩu tạm: ${tempPassword}`;
  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-brand-tint p-4">
      <p className="text-sm text-ink">
        Gửi thông tin này cho thành viên. Mật khẩu chỉ hiện một lần. Lần đầu đăng nhập, họ sẽ phải tự đổi mật khẩu.
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-body">Tên đăng nhập</dt>
        <dd className="font-semibold text-ink">{username}</dd>
        <dt className="text-body">Mật khẩu tạm</dt>
        <dd className="font-mono font-semibold tracking-wide text-ink">{tempPassword}</dd>
      </dl>
      <CopyButton text={text} label="Sao chép thông tin" />
    </div>
  );
}

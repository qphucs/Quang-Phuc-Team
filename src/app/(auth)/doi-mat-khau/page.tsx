import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Đổi mật khẩu" };

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/dang-nhap");
  const firstTime = session.user.mustChangePassword;

  return (
    <>
      <h1 className="text-h2 font-semibold">{firstTime ? "Đặt mật khẩu mới" : "Đổi mật khẩu"}</h1>
      <p className="mt-1 mb-6 text-sm text-body">
        {firstTime
          ? "Đây là lần đầu bạn đăng nhập. Hãy đổi mật khẩu tạm thành mật khẩu của riêng bạn."
          : "Mật khẩu mới có ít nhất 8 ký tự."}
      </p>
      <ChangePasswordForm />
    </>
  );
}

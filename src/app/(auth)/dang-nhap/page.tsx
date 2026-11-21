import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function SignInPage() {
  return (
    <>
      <h1 className="text-h2 font-semibold">Đăng nhập</h1>
      <p className="mt-1 mb-6 text-sm text-body">Dùng tài khoản do quản trị cấp cho bạn.</p>
      <LoginForm />
    </>
  );
}

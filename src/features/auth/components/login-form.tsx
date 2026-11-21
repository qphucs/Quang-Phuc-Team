"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { ERROR_CODES } from "@/lib/errors";
import { signInSchema, type SignInInput } from "../schemas";

function signInErrorMessage(status: number | undefined): string {
  if (status === 429) return "Bạn đăng nhập sai quá nhiều lần. Hãy thử lại sau 15 phút.";
  if (status === 403) return "Tài khoản đã bị khóa. Hãy liên hệ quản trị.";
  if (status === 401 || status === 400) return "Sai tên đăng nhập hoặc mật khẩu.";
  return ERROR_CODES.INTERNAL_ERROR.message;
}

export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const { error } = await authClient.signIn.username(values);
    if (error) {
      setFormError(signInErrorMessage(error.status));
      return;
    }
    router.replace("/");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <Label htmlFor="username">Tên đăng nhập</Label>
        <Input
          id="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          aria-invalid={Boolean(errors.username)}
          aria-describedby="username-error"
          {...register("username")}
        />
        <FieldError id="username-error">{errors.username?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby="password-error"
          {...register("password")}
        />
        <FieldError id="password-error">{errors.password?.message}</FieldError>
      </div>
      {formError ? (
        <p role="alert" className="rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger-ink">
          {formError}
        </p>
      ) : null}
      <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? null : <LogIn aria-hidden />}
        Đăng nhập
      </Button>
    </form>
  );
}

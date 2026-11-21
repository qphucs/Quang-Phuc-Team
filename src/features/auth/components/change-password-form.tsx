"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { changePassword } from "../actions";
import { changePasswordSchema, type ChangePasswordInput } from "../schemas";

const FIELDS = [
  { name: "currentPassword", label: "Mật khẩu hiện tại", autoComplete: "current-password" },
  { name: "newPassword", label: "Mật khẩu mới (ít nhất 8 ký tự)", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Nhập lại mật khẩu mới", autoComplete: "new-password" },
] as const;

export function ChangePasswordForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    const result = await changePassword(values);
    if (!result.ok) {
      const fields = result.error.fields ?? {};
      for (const field of FIELDS) {
        const message = fields[field.name];
        if (message) setError(field.name, { message });
      }
      if (Object.keys(fields).length === 0) toast.error(result.error.message);
      return;
    }
    toast.success("Đã đổi mật khẩu.");
    router.replace("/");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {FIELDS.map((field) => (
        <div key={field.name}>
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            type="password"
            autoComplete={field.autoComplete}
            aria-invalid={Boolean(errors[field.name])}
            aria-describedby={`${field.name}-error`}
            {...register(field.name)}
          />
          <FieldError id={`${field.name}-error`}>{errors[field.name]?.message}</FieldError>
        </div>
      ))}
      <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
        Đổi mật khẩu
      </Button>
    </form>
  );
}

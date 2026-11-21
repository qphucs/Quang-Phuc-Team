"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { createMember } from "../actions";
import { createMemberSchema, type CreateMemberInput } from "../schemas";
import { CredentialsPanel } from "./credentials-panel";

type Created = { username: string; tempPassword: string };

export function CreateMemberForm({ isOwner, onDone }: { isOwner: boolean; onDone?: () => void }) {
  const queryClient = useQueryClient();
  const [created, setCreated] = useState<Created | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateMemberInput>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: { role: "member" },
  });

  if (created) {
    return (
      <div className="flex flex-col gap-4">
        <CredentialsPanel username={created.username} tempPassword={created.tempPassword} />
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => {
            setCreated(null);
            reset({ role: "member" });
          }}
        >
          Tạo tài khoản khác
        </Button>
        {onDone ? (
          <Button size="lg" className="w-full" onClick={onDone}>
            Xong
          </Button>
        ) : null}
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await createMember(values);
    if (!result.ok) {
      const fields = result.error.fields ?? {};
      for (const [name, message] of Object.entries(fields)) {
        setError(name as keyof CreateMemberInput, { message });
      }
      if (Object.keys(fields).length === 0) toast.error(result.error.message);
      return;
    }
    toast.success("Đã tạo tài khoản.");
    setCreated({ username: result.data.username, tempPassword: result.data.tempPassword });
    await queryClient.invalidateQueries({ queryKey: ["members"] });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <Label htmlFor="name">Họ tên</Label>
        <Input id="name" aria-invalid={Boolean(errors.name)} aria-describedby="name-error" {...register("name")} />
        <FieldError id="name-error">{errors.name?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="username">Tên đăng nhập</Label>
        <Input
          id="username"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="vd: minhanh"
          aria-invalid={Boolean(errors.username)}
          aria-describedby="username-error"
          {...register("username")}
        />
        <FieldError id="username-error">{errors.username?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="phone">Số điện thoại (không bắt buộc)</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby="phone-error"
          {...register("phone")}
        />
        <FieldError id="phone-error">{errors.phone?.message}</FieldError>
      </div>
      {isOwner ? (
        <div>
          <Label htmlFor="role">Vai trò</Label>
          <select
            id="role"
            className="h-11 w-full rounded-sm border border-line bg-surface px-3 text-base text-ink focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none"
            {...register("role")}
          >
            <option value="member">Thành viên</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>
      ) : null}
      <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
        Tạo tài khoản
      </Button>
    </form>
  );
}

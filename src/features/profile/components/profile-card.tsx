"use client";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/format";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateOwnProfile } from "../actions";
import { updateOwnProfileSchema, type UpdateOwnProfileInput } from "../schemas";

type Props = {
  name: string;
  username: string;
  phone: string | null;
  image: string | null;
  roleLabel: string;
  joinedAt: Date;
};

export function ProfileCard({ name, username, phone, image, roleLabel, joinedAt }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar name={name} src={image} size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-h3 font-semibold text-ink">{name}</p>
          <p className="truncate text-sm text-muted">@{username}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="brand">{roleLabel}</Badge>
            <Badge>Tham gia {formatDate(joinedAt)}</Badge>
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted">Số điện thoại</dt>
        <dd className="text-ink">{phone ?? "Chưa có"}</dd>
      </dl>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Pencil aria-hidden />
        Sửa hồ sơ
      </Button>

      <Sheet open={open} onOpenChange={setOpen} title="Sửa hồ sơ">
        <EditProfileForm
          defaults={{ name, phone: phone ?? "" }}
          onSaved={async () => {
            await queryClient.invalidateQueries();
            setOpen(false);
          }}
        />
      </Sheet>
    </Card>
  );
}

function EditProfileForm({
  defaults,
  onSaved,
}: {
  defaults: { name: string; phone: string };
  onSaved: () => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateOwnProfileInput>({ resolver: zodResolver(updateOwnProfileSchema), defaultValues: defaults });

  const onSubmit = handleSubmit(async (values) => {
    const result = await updateOwnProfile(values);
    if (!result.ok) {
      const fields = result.error.fields ?? {};
      for (const [name, message] of Object.entries(fields)) {
        setError(name as keyof UpdateOwnProfileInput, { message });
      }
      if (Object.keys(fields).length === 0) toast.error(result.error.message);
      return;
    }
    toast.success("Đã lưu hồ sơ.");
    await onSaved();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <Label htmlFor="profile-name">Họ tên</Label>
        <Input id="profile-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
        <FieldError>{errors.name?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="profile-phone">Số điện thoại</Label>
        <Input
          id="profile-phone"
          type="tel"
          inputMode="tel"
          aria-invalid={Boolean(errors.phone)}
          {...register("phone")}
        />
        <FieldError>{errors.phone?.message}</FieldError>
      </div>
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Lưu hồ sơ
      </Button>
    </form>
  );
}

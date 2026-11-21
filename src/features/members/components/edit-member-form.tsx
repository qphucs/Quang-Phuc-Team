"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { updateMember } from "../actions";
import { updateMemberSchema, type UpdateMemberInput } from "../schemas";

type Member = {
  id: string;
  name: string;
  phone: string | null;
  status: "active" | "paused" | "left";
  role: "owner" | "admin" | "member";
  adminNote: string | null;
};

/** Admin edits a member. Status and role are hidden when not allowed (server re-checks anyway). */
export function EditMemberForm({
  member,
  canChangeRole,
  canChangeStatus,
  onDone,
}: {
  member: Member;
  canChangeRole: boolean;
  canChangeStatus: boolean;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateMemberInput>({
    resolver: zodResolver(updateMemberSchema),
    defaultValues: {
      id: member.id,
      name: member.name,
      phone: member.phone ?? "",
      status: member.status,
      role: member.role === "admin" ? "admin" : "member",
      adminNote: member.adminNote ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await updateMember(values);
    if (!result.ok) {
      const fields = result.error.fields ?? {};
      for (const [name, message] of Object.entries(fields)) {
        setError(name as keyof UpdateMemberInput, { message });
      }
      if (Object.keys(fields).length === 0) toast.error(result.error.message);
      return;
    }
    toast.success("Đã lưu thay đổi.");
    await queryClient.invalidateQueries({ queryKey: ["member", member.id] });
    await queryClient.invalidateQueries({ queryKey: ["members"] });
    onDone();
  });

  const selectClass =
    "h-11 w-full rounded-sm border border-line bg-surface px-3 text-base text-ink focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <input type="hidden" {...register("id")} />
      <div>
        <Label htmlFor="edit-name">Họ tên</Label>
        <Input id="edit-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
        <FieldError>{errors.name?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="edit-phone">Số điện thoại</Label>
        <Input id="edit-phone" type="tel" inputMode="tel" aria-invalid={Boolean(errors.phone)} {...register("phone")} />
        <FieldError>{errors.phone?.message}</FieldError>
      </div>
      {canChangeStatus ? (
        <div>
          <Label htmlFor="edit-status">Trạng thái làm việc</Label>
          <select id="edit-status" className={selectClass} {...register("status")}>
            <option value="active">Đang làm</option>
            <option value="paused">Tạm nghỉ</option>
            <option value="left">Đã nghỉ</option>
          </select>
        </div>
      ) : null}
      {canChangeRole ? (
        <div>
          <Label htmlFor="edit-role">Vai trò</Label>
          <select id="edit-role" className={selectClass} {...register("role")}>
            <option value="member">Thành viên</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>
      ) : null}
      <div>
        <Label htmlFor="edit-note">Ghi chú nội bộ (chỉ quản trị thấy)</Label>
        <textarea
          id="edit-note"
          rows={3}
          className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-base text-ink focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none"
          {...register("adminNote")}
        />
        <FieldError>{errors.adminNote?.message}</FieldError>
      </div>
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Lưu thay đổi
      </Button>
    </form>
  );
}

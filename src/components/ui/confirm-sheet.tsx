"use client";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

/** Confirmation step for risky actions. Keeps the danger button away from accidental taps. */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  danger = false,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<{ ok: boolean; message?: string }>;
  children?: ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          setError(null);
          onOpenChange(next);
        }
      }}
      title={title}
      description={description}
    >
      {error ? (
        <p role="alert" className="mb-3 rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger-ink">
          {error}
        </p>
      ) : null}
      {children}
      <div className="flex flex-col gap-2">
        <Button
          variant={danger ? "danger" : "primary"}
          size="lg"
          loading={pending}
          className="w-full"
          onClick={async () => {
            setPending(true);
            setError(null);
            const result = await onConfirm();
            setPending(false);
            if (result.ok) onOpenChange(false);
            else setError(result.message ?? "Có lỗi xảy ra. Hãy thử lại.");
          }}
        >
          {confirmLabel}
        </Button>
        <Button variant="secondary" size="lg" className="w-full" disabled={pending} onClick={() => onOpenChange(false)}>
          Hủy
        </Button>
      </div>
    </Sheet>
  );
}

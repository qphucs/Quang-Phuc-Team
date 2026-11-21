"use client";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 🔒 Bottom sheet — replaces modals on mobile. Top radius 20, drag handle, overlay shadow. */
export function Sheet({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-lg bg-white px-4 pt-3 pb-safe shadow-overlay",
            "lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2 lg:rounded-lg",
          )}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line lg:hidden" aria-hidden />
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-h3 font-semibold text-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-body">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="-mt-1 -mr-2 flex size-11 items-center justify-center rounded-full text-muted active:bg-surface">
              <X className="size-5" />
              <span className="sr-only">Đóng</span>
            </Dialog.Close>
          </div>
          <div className="pb-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

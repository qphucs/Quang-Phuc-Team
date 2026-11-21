"use client";
import { Toaster as Sonner } from "sonner";

/** 🔒 Toast: top-center, auto-hide 4s. Variants used: success · error · info. */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "!rounded-md !border !border-line !bg-white !text-ink !shadow-overlay !font-sans !text-sm !gap-3",
          description: "!text-body",
          success: "[&_[data-icon]]:!text-success",
          error: "[&_[data-icon]]:!text-danger",
          info: "[&_[data-icon]]:!text-brand-ink",
        },
      }}
    />
  );
}

export { toast } from "sonner";

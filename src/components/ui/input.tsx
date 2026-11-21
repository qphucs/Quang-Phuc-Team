import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** 🔒 Single input style: 44px, surface background, 16px text (prevents iOS zoom). */
export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-sm border border-line bg-surface px-3 text-base text-ink transition-colors placeholder:text-muted",
        "focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1 block text-sm font-medium text-ink", className)} {...props} />;
}

export function FieldError({ children, id }: { children?: string; id?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-danger-ink">
      {children}
    </p>
  );
}

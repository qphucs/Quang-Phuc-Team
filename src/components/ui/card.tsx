import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** 🔒 Card: white, 1px line border, radius 12, padding 16, NO shadow. */
export function Card({ className, interactive = false, ...props }: ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border border-line bg-white p-4",
        interactive && "cursor-pointer transition-colors active:bg-surface",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("text-h3 font-semibold", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-sm text-body", className)} {...props} />;
}

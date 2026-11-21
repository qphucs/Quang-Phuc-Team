import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** 🔒 Variants: neutral · brand · success · warning · danger · violet · pink. Tint background + ink text. */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-medium whitespace-nowrap [&_svg]:size-4",
  {
    variants: {
      variant: {
        neutral: "bg-surface text-ink",
        brand: "bg-brand-tint text-brand-ink",
        success: "bg-success-tint text-success-ink",
        warning: "bg-warning-tint text-warning-ink",
        danger: "bg-danger-tint text-danger-ink",
        violet: "bg-violet-tint text-ink",
        pink: "bg-pink-tint text-ink",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export function Badge({ className, variant, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

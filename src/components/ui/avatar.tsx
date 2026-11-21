import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const SIZES = {
  24: "size-6 text-caption",
  32: "size-8 text-caption",
  40: "size-10 text-sm",
  64: "size-16 text-h3",
} as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const last = parts.at(-1) ?? "";
  return (last[0] ?? "?").toUpperCase();
}

/** 🔒 Sizes 24 · 32 · 40 · 64. Fallback: first letter of the given name on brand-tint. */
export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full", SIZES[size], className)}
    >
      {src ? <AvatarPrimitive.Image src={src} alt={name} className="size-full object-cover" /> : null}
      <AvatarPrimitive.Fallback className="flex size-full items-center justify-center bg-brand-tint font-semibold text-brand-ink">
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

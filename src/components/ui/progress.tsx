import { cn } from "@/lib/utils";

/** 🔒 Progress bar: brand on surface. `value` is 0–100. */
export function Progress({ value, className, label }: { value: number; className?: string; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface", className)}
    >
      <div className="h-full rounded-full bg-brand transition-[width] duration-200" style={{ width: `${clamped}%` }} />
    </div>
  );
}

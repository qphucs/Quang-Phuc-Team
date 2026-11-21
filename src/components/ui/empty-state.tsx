import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** 🔒 Empty state: 40px muted icon + one sentence + optional action. */
export function EmptyState({ icon: Icon, text, action }: { icon: LucideIcon; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <Icon className="size-10 text-muted" strokeWidth={1.75} aria-hidden />
      <p className="text-sm text-body">{text}</p>
      {action}
    </div>
  );
}

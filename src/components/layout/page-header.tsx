import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-h1 font-bold">{title}</h1>
        {description ? <p className="mt-1 text-sm text-body">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

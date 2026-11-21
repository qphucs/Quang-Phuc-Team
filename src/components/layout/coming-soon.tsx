import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { COPY } from "@/lib/copy";
import { PageHeader } from "./page-header";

/** Placeholder page for modules scheduled in later sprints. */
export function ComingSoon({
  title,
  description,
  icon,
  sprint,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  sprint: number;
}) {
  return (
    <>
      <PageHeader title={title} description={description} action={<Badge variant="brand">Sprint {sprint}</Badge>} />
      <Card>
        <EmptyState icon={icon} text={COPY.comingSoon} />
      </Card>
    </>
  );
}

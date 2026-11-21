import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SkillEditor } from "@/features/skills/components/skill-editor";
import { loadEditorInitial } from "@/features/skills/editor-data";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Sửa bài học" };

export default async function EditSkillPage({ params }: PageProps<"/quan-tri/bai-hoc/[id]">) {
  const { id } = await params;
  await requirePermission("skill:write");
  let initial;
  try {
    initial = await loadEditorInitial(id);
  } catch {
    notFound();
  }
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h1 font-bold">Sửa bài học</h1>
      <SkillEditor initial={initial} />
    </div>
  );
}

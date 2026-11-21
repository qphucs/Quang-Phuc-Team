import type { Metadata } from "next";
import { SkillEditor } from "@/features/skills/components/skill-editor";
import { listLevels } from "@/features/learning/service";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Tạo bài học" };

export default async function NewSkillPage() {
  await requirePermission("skill:write");
  const levels = await listLevels();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h1 font-bold">Tạo bài học</h1>
      <SkillEditor levels={levels.map((l) => ({ id: l.id, number: l.number, name: l.name }))} />
    </div>
  );
}

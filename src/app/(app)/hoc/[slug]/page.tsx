import type { Metadata } from "next";
import { SkillDetail } from "@/features/skills/components/skill-detail";

export const metadata: Metadata = { title: "Bài học" };

export default async function SkillPage({ params }: PageProps<"/hoc/[slug]">) {
  const { slug } = await params;
  return <SkillDetail slug={slug} />;
}

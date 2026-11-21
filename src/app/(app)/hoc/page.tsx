import type { Metadata } from "next";
import { SkillLibrary } from "@/features/skills/components/skill-library";

export const metadata: Metadata = { title: "Học" };

export default function LearnPage() {
  return <SkillLibrary />;
}

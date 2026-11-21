import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KitchenSink } from "./kitchen-sink";

export const metadata: Metadata = { title: "Kitchen sink" };

/** Dev-only page showing every locked component for design review. */
export default function KitchenSinkPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <KitchenSink />;
}

import { redirect } from "next/navigation";

// Sprint 1: the admin home is the member list. Later sprints add a dashboard here.
export default function AdminHomePage() {
  redirect("/quan-tri/thanh-vien");
}

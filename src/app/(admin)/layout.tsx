import { SignedInShell } from "@/components/layout/signed-in-shell";

export default function AdminLayout({ children }: LayoutProps<"/">) {
  return <SignedInShell permission="member:manage">{children}</SignedInShell>;
}

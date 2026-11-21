import { SignedInShell } from "@/components/layout/signed-in-shell";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <SignedInShell>{children}</SignedInShell>;
}

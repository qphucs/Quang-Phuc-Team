"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { COPY } from "@/lib/copy";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="secondary"
      className={className}
      loading={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.replace("/dang-nhap");
        router.refresh();
      }}
    >
      {pending ? null : <LogOut aria-hidden />}
      {COPY.signOut}
    </Button>
  );
}

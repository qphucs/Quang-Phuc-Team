import { Bell } from "lucide-react";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/copy";
import { BottomNav } from "./bottom-nav";
import { RealtimeBridge } from "./realtime-bridge";
import { Sidebar } from "./sidebar";

export type ShellUser = { name: string; image?: string | null; roleLabel: string };

/** Mobile: top bar 56px + bottom nav 64px. Desktop (≥1024px): 240px sidebar, content max 1200px. */
export function AppShell({ user, isAdmin, children }: { user: ShellUser; isAdmin: boolean; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <Sidebar user={user} isAdmin={isAdmin} />
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <span className="font-bold text-ink">{APP_NAME}</span>
        <button
          type="button"
          className="-mr-2 flex size-11 items-center justify-center rounded-full active:bg-surface"
          aria-label="Thông báo"
        >
          <Bell className="size-5 text-ink" strokeWidth={1.75} />
        </button>
      </header>
      <main className="pb-24 lg:pb-10 lg:pl-60">
        <div className="mx-auto w-full max-w-[1200px] px-4 pt-4 md:px-6 lg:pt-8">{children}</div>
      </main>
      <BottomNav />
      <RealtimeBridge />
    </div>
  );
}

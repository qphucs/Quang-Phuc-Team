"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { APP_NAME, COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, isActive, MAIN_NAV, type NavItem } from "./nav-config";
import type { ShellUser } from "./app-shell";

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-sm px-3 text-sm font-medium transition-colors",
        active ? "bg-brand-tint text-ink" : "text-body hover:bg-surface",
      )}
    >
      <Icon className={cn("size-5", active ? "text-brand-ink" : "text-muted")} strokeWidth={1.75} aria-hidden />
      {item.label}
    </Link>
  );
}

export function Sidebar({ user, isAdmin }: { user: ShellUser; isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-white lg:flex">
      <div className="flex h-14 items-center gap-2 border-b border-line px-4">
        <span className="flex size-8 items-center justify-center rounded-sm bg-brand text-caption font-bold text-ink">
          QP
        </span>
        <span className="font-bold text-ink">{APP_NAME}</span>
      </div>
      <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {MAIN_NAV.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
        {isAdmin ? (
          <>
            <p className="mt-6 mb-1 px-3 text-caption font-medium text-muted">{COPY.admin}</p>
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        ) : null}
      </nav>
      <Link href="/toi" className="flex items-center gap-3 border-t border-line p-4 hover:bg-surface">
        <Avatar name={user.name} src={user.image} size={32} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
          <p className="truncate text-caption text-muted">{user.roleLabel}</p>
        </div>
      </Link>
    </aside>
  );
}

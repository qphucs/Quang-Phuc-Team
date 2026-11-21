import { BookOpen, Download, House, TrendingUp, User, Users, type LucideIcon } from "lucide-react";

import type { Route } from "next";

export type NavItem = { href: Route; label: string; icon: LucideIcon };

/** 🔒 Bottom nav — exactly 5 tabs (docs/02-design-system.md §5). */
export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Trang chủ", icon: House },
  { href: "/hoc", label: "Học", icon: BookOpen },
  { href: "/trend", label: "Trend", icon: TrendingUp },
  { href: "/tai", label: "Tải", icon: Download },
  { href: "/toi", label: "Tôi", icon: User },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/quan-tri/thanh-vien", label: "Thành viên", icon: Users },
  { href: "/quan-tri/tai-xuong", label: "Nhật ký tải", icon: Download },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

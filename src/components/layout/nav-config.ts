import {
  BookOpen,
  Download,
  House,
  Layers,
  LayoutDashboard,
  ListChecks,
  Settings,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Route } from "next";

export type NavItem = { href: Route; label: string; icon: LucideIcon; ownerOnly?: boolean };

/** 🔒 Bottom nav — exactly 5 tabs (docs/02-design-system.md §5). */
export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Trang chủ", icon: House },
  { href: "/hoc", label: "Học", icon: BookOpen },
  { href: "/trend", label: "Trend", icon: TrendingUp },
  { href: "/tai", label: "Tải", icon: Download },
  { href: "/toi", label: "Tôi", icon: User },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/quan-tri", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/quan-tri/thanh-vien", label: "Thành viên", icon: Users },
  { href: "/quan-tri/bai-hoc", label: "Bài học", icon: BookOpen },
  { href: "/quan-tri/lo-trinh", label: "Lộ trình", icon: Layers },
  { href: "/quan-tri/tien-do", label: "Tiến độ học", icon: ListChecks },
  { href: "/quan-tri/trend", label: "Duyệt trend", icon: TrendingUp },
  { href: "/quan-tri/cai-dat", label: "Cài đặt", icon: Settings, ownerOnly: true },
  { href: "/quan-tri/tai-xuong", label: "Nhật ký tải", icon: Download },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

import {
  Banknote,
  CalendarCheck,
  CalendarRange,
  ClipboardList,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Resource } from "@/lib/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  resource?: Resource;
  action?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Students",
    href: "/students",
    icon: GraduationCap,
    resource: "students",
    action: "read",
  },
  {
    label: "Enrollments",
    href: "/enrollments",
    icon: ClipboardList,
    resource: "groupsAndSessions",
    action: "read",
  },
  {
    label: "Teachers",
    href: "/teachers",
    icon: Users,
    resource: "teachersAndSalaries",
    action: "readTeachers",
  },
  {
    label: "Groups",
    href: "/groups",
    icon: Layers,
    resource: "groupsAndSessions",
    action: "read",
  },
  {
    label: "Schedules",
    href: "/schedules",
    icon: CalendarRange,
    resource: "groupsAndSessions",
    action: "read",
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: CalendarCheck,
    resource: "groupsAndSessions",
    action: "read",
  },
  {
    label: "Payments",
    href: "/payments",
    icon: Banknote,
    resource: "paymentsAndExpenses",
    action: "read",
  },
  {
    label: "Salaries",
    href: "/salaries",
    icon: Wallet,
    resource: "teachersAndSalaries",
    action: "manageSalaries",
  },
  {
    label: "Expenses",
    href: "/expenses",
    icon: Receipt,
    resource: "paymentsAndExpenses",
    action: "createExpense",
  },
  {
    label: "Users",
    href: "/users",
    icon: ShieldCheck,
    resource: "users",
    action: "read",
  },
];

export const ROLE_TONE_CLASSES: Record<string, string> = {
  SUPERADMIN: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  ADMIN: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  MANAGER: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  ACCOUNTANT: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  RECEPTIONIST: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

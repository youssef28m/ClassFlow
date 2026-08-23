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
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { Resource } from "@/lib/permissions";

export interface NavItem {
  labelKey: TranslationKey;
  href: string;
  icon: LucideIcon;
  resource?: Resource;
  action?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    labelKey: "nav.students",
    href: "/students",
    icon: GraduationCap,
    resource: "students",
    action: "read",
  },
  {
    labelKey: "nav.enrollments",
    href: "/enrollments",
    icon: ClipboardList,
    resource: "groupsAndSessions",
    action: "read",
  },
  {
    labelKey: "nav.teachers",
    href: "/teachers",
    icon: Users,
    resource: "teachersAndSalaries",
    action: "readTeachers",
  },
  {
    labelKey: "nav.groups",
    href: "/groups",
    icon: Layers,
    resource: "groupsAndSessions",
    action: "read",
  },
  {
    labelKey: "nav.schedules",
    href: "/schedules",
    icon: CalendarRange,
    resource: "groupsAndSessions",
    action: "read",
  },
  {
    labelKey: "nav.attendance",
    href: "/attendance",
    icon: CalendarCheck,
    resource: "groupsAndSessions",
    action: "read",
  },
  {
    labelKey: "nav.payments",
    href: "/payments",
    icon: Banknote,
    resource: "paymentsAndExpenses",
    action: "read",
  },
  {
    labelKey: "nav.salaries",
    href: "/salaries",
    icon: Wallet,
    resource: "teachersAndSalaries",
    action: "manageSalaries",
  },
  {
    labelKey: "nav.expenses",
    href: "/expenses",
    icon: Receipt,
    resource: "paymentsAndExpenses",
    action: "createExpense",
  },
  {
    labelKey: "nav.users",
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

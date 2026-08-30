"use client";

import { ArrowLeft, CalendarDays, Languages, LogOut, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ROLE_TONE_CLASSES,
  navItemsFor,
  type NavItem,
} from "@/components/navigation/nav-config";
import { hasPermission, resolveScope } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-store";
import { useActingCenter, useCenterScope } from "@/lib/center-scope";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/dictionary";

function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  const next: Locale = locale === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      title={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
    >
      <Languages className="size-3.5" aria-hidden />
      {locale === "ar" ? "EN" : "عربي"}
    </button>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, tEnum } = useI18n();
  const { centerId, setCenterId } = useCenterScope();
  const actingCenter = useActingCenter();

  const isSuperadmin = user?.role === "SUPERADMIN";
  const scoped = isSuperadmin && centerId !== null;

  const visibleItems = navItemsFor(user, centerId).filter(
    (item) =>
      !item.resource ||
      !item.action ||
      hasPermission(user, item.resource, item.action),
  );

  const activeItem = visibleItems.reduce<NavItem | null>((best, item) => {
    const matches =
      pathname === item.href || pathname.startsWith(item.href + "/");
    return matches && (!best || item.href.length > best.href.length)
      ? item
      : best;
  }, null);

  const exitCenter = () => {
    setCenterId(null);
    onNavigate?.();
    void router.push("/admin");
  };

  const scopeLabel = !user
    ? ""
    : scoped
      ? (actingCenter?.name ?? t("dashboard.center", { id: centerId ?? 0 }))
      : resolveScope(user) === "all"
        ? t("dashboard.allCenters")
        : user.centerId != null
          ? t("dashboard.center", { id: user.centerId })
          : t("dashboard.noCenter");

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarDays className="size-4.5" aria-hidden />
        </span>
        <span className="text-lg font-bold tracking-tight text-card-foreground">
          ClassFlow
        </span>
      </div>

      <nav aria-label={t("nav.mainNavigation")} className="scroll-slim flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const active = item === activeItem;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-card-foreground"
              }`}
            >
              <item.icon className="size-4 shrink-0" aria-hidden />
              {t(item.labelKey)}
            </a>
          );
        })}
      </nav>

      {scoped ? (
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              exitCenter();
            }}
            className="flex w-full items-center gap-3 rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <ArrowLeft className="size-4 shrink-0 rtl:rotate-180" aria-hidden />
            {t("nav.returnToAdmin")}
          </button>
        </div>
      ) : null}

      {user ? (
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {user.username.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-card-foreground">
                {user.username}
              </p>
              <p className="truncate text-xs text-muted-foreground">{scopeLabel}</p>
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 px-2 pb-1">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_TONE_CLASSES[user.role] ?? ""}`}
            >
              {tEnum(user.role)}
            </span>
            <LanguageToggle />
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                void logout();
              }}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            >
              <LogOut className="size-3.5" aria-hidden />
              {t("common.signOut")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useI18n();

  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-e border-border bg-card lg:block">
        <SidebarContent />
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 start-0 w-72 max-w-[85vw] border-e border-border bg-card shadow-xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label={t("common.close")}
              className="absolute end-3 top-4 z-10 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t("nav.openNavigation")}
            aria-expanded={drawerOpen}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <span className="text-base font-bold tracking-tight text-card-foreground">
            ClassFlow
          </span>
          {user ? (
            <span className="ms-auto flex items-center gap-2 text-xs text-muted-foreground">
              <LanguageToggle />
              {user.username}
            </span>
          ) : null}
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

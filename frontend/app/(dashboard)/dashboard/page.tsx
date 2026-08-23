"use client";

import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ROLE_TONE_CLASSES } from "@/components/navigation/nav-config";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n/provider";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <>
      <PageHeader
        title={t("dashboard.welcome", { name: user?.username ?? "" })}
        description={t("dashboard.description")}
      />
      {user ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-6 py-5">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarDays className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-card-foreground">{user.username}</p>
            <p className="text-sm text-muted-foreground">
              {resolveCenterLabel(user.centerId, t)}
            </p>
          </div>
          <span
            className={`ms-auto rounded-full px-3 py-1 text-xs font-medium ${ROLE_TONE_CLASSES[user.role] ?? ""}`}
          >
            {user.role}
          </span>
        </div>
      ) : null}
    </>
  );
}

function resolveCenterLabel(
  centerId: number | null,
  t: ReturnType<typeof useI18n>["t"],
): string {
  if (centerId == null) return t("dashboard.globalAccess");
  return t("dashboard.workingInCenter", { id: centerId });
}

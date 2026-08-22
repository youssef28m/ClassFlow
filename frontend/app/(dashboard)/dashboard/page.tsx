"use client";

import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ROLE_TONE_CLASSES } from "@/components/navigation/nav-config";
import { useAuth } from "@/lib/auth-store";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.username ?? ""}`}
        description="Operational summaries arrive in a later phase."
      />
      {user ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-6 py-5">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarDays className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-card-foreground">{user.username}</p>
            <p className="text-sm text-muted-foreground">
              {resolveCenterLabel(user.centerId)}
            </p>
          </div>
          <span
            className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${ROLE_TONE_CLASSES[user.role] ?? ""}`}
          >
            {user.role}
          </span>
        </div>
      ) : null}
    </>
  );
}

function resolveCenterLabel(centerId: number | null): string {
  if (centerId == null) return "Global access — all centers";
  return `Working in center #${centerId}`;
}

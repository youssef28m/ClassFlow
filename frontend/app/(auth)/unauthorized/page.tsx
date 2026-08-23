"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";

export default function UnauthorizedPage() {
  const { t } = useI18n();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <ShieldAlert className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {t("unauthorized.title")}
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {t("unauthorized.description")}
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
      >
        {t("common.backToDashboard")}
      </Link>
    </main>
  );
}

"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

interface ErrorStateProps {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
}

function describeError(error: unknown): string | undefined {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return undefined;
}

export function ErrorState({
  title,

  error,
  onRetry,
}: ErrorStateProps) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t("common.somethingWentWrong");
  const description = describeError(error);
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 px-6 py-16 text-center"
    >
      <AlertTriangle className="size-8 text-red-500" aria-hidden />
      <p className="font-medium text-card-foreground">{resolvedTitle}</p>
      {description ? (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 flex h-9 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
        >
          <RotateCw className="size-3.5" aria-hidden />
          {t("common.tryAgain")}
        </button>
      ) : null}
    </div>
  );
}

"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { useI18n } from "@/lib/i18n/provider";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <ErrorState
          title={t("common.somethingWentWrong")}
          error={error}
          onRetry={reset}
        />
      </div>
    </main>
  );
}

"use client";

import { ErrorState } from "@/components/feedback/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <ErrorState
          title="Something went wrong"
          error={error}
          onRetry={reset}
        />
      </div>
    </main>
  );
}

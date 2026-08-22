import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "No access",
};

export default function UnauthorizedPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <ShieldAlert className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        You do not have access to this area
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Your account is not permitted to view this section. If you believe this
        is a mistake, contact your center administrator.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
      >
        Back to dashboard
      </Link>
    </main>
  );
}

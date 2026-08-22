import { Compass } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <EmptyState
          icon={Compass}
          title="Page not found"
          description="The page you are looking for does not exist or has been moved."
          action={
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Back to dashboard
            </Link>
          }
        />
      </div>
    </main>
  );
}

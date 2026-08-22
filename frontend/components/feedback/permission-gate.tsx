"use client";

import { Loader2, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { can, type ActionsOf, type Resource } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-store";

interface PermissionGateProps<R extends Resource> {
  resource: R;
  action: ActionsOf<R>;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate<R extends Resource>({
  resource,
  action,
  children,
  fallback,
}: PermissionGateProps<R>) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!can(user, resource, action)) {
    return (
      fallback ?? (
        <EmptyState
          icon={ShieldAlert}
          title="No access to this area"
          description="Your role does not include permission for this section. Contact an administrator if you believe this is a mistake."
        />
      )
    );
  }

  return <>{children}</>;
}

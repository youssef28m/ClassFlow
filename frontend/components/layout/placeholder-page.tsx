"use client";

import { Construction, Loader2, ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/lib/auth-store";
import { hasPermission, type Resource } from "@/lib/permissions";

interface PlaceholderPageProps {
  title: string;
  description?: string;
  resource?: Resource;
  action?: string;
}

export function PlaceholderPage({
  title,
  description,
  resource,
  action,
}: PlaceholderPageProps) {
  const { user, status } = useAuth();

  const gated = Boolean(resource && action);
  const allowed = !gated || hasPermission(user, resource!, action!);

  let body = (
    <EmptyState
      icon={Construction}
      title="Under construction"
      description={`The ${title.toLowerCase()} workspace arrives with the next delivery phase. Navigation, permissions, and layout are already wired up.`}
    />
  );

  if (gated) {
    if (status === "loading") {
      body = (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      );
    } else if (!allowed) {
      body = (
        <EmptyState
          icon={ShieldAlert}
          title="No access to this area"
          description="Your role does not include permission for this section. Contact an administrator if you believe this is a mistake."
        />
      );
    }
  }

  return (
    <>
      <PageHeader title={title} description={description} />
      {body}
    </>
  );
}

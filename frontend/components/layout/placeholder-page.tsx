"use client";

import { Construction, Loader2, ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n/provider";
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
  const { t } = useI18n();

  const gated = Boolean(resource && action);
  const allowed = !gated || hasPermission(user, resource!, action!);

  let body = (
    <EmptyState
      icon={Construction}
      title={t("placeholder.title")}
      description={t("placeholder.description")}
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
          title={t("placeholder.noAccessTitle")}
          description={t("placeholder.noAccessDescription")}
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

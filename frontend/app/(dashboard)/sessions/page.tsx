"use client";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { useI18n } from "@/lib/i18n/provider";

export default function SessionsPage() {
  const { t } = useI18n();
  return (
    <PlaceholderPage
      title={t("placeholder.sessions.title")}
      description={t("placeholder.sessions.description")}
      resource="groupsAndSessions"
      action="read"
    />
  );
}

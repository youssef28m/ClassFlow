"use client";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { useI18n } from "@/lib/i18n/provider";

export default function UsersPage() {
  const { t } = useI18n();
  return (
    <PlaceholderPage
      title={t("placeholder.users.title")}
      description={t("placeholder.users.description")}
      resource="users"
      action="read"
    />
  );
}

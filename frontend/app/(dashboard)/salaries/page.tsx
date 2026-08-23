"use client";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { useI18n } from "@/lib/i18n/provider";

export default function SalariesPage() {
  const { t } = useI18n();
  return (
    <PlaceholderPage
      title={t("placeholder.salaries.title")}
      description={t("placeholder.salaries.description")}
      resource="teachersAndSalaries"
      action="manageSalaries"
    />
  );
}

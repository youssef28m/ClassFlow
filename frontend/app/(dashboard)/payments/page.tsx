"use client";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { useI18n } from "@/lib/i18n/provider";

export default function PaymentsPage() {
  const { t } = useI18n();
  return (
    <PlaceholderPage
      title={t("placeholder.payments.title")}
      description={t("placeholder.payments.description")}
      resource="paymentsAndExpenses"
      action="read"
    />
  );
}

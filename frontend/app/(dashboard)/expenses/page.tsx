"use client";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { useI18n } from "@/lib/i18n/provider";

export default function ExpensesPage() {
  const { t } = useI18n();
  return (
    <PlaceholderPage
      title={t("placeholder.expenses.title")}
      description={t("placeholder.expenses.description")}
      resource="paymentsAndExpenses"
      action="createExpense"
    />
  );
}

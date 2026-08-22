"use client";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function ExpensesPage() {
  return (
    <PlaceholderPage
      title="Expenses"
      description="Center expenses by category and period."
      resource="paymentsAndExpenses"
      action="createExpense"
    />
  );
}

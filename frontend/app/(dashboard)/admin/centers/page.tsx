"use client";

import { PageHeader } from "@/components/layout/page-header";
import { AdminGuard } from "@/features/admin/admin-guard";
import { CentersPanel } from "@/features/centers/components/centers-panel";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminCentersPage() {
  const { t } = useI18n();

  return (
    <AdminGuard>
      <PageHeader title={t("admin.centers.title")} description={t("admin.description")} />
      <CentersPanel />
    </AdminGuard>
  );
}
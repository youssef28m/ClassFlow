"use client";

import { PageHeader } from "@/components/layout/page-header";
import { AdminGuard } from "@/features/admin/admin-guard";
import { UsersPanel } from "@/features/users/components/users-panel";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminUsersPage() {
  const { t } = useI18n();

  return (
    <AdminGuard>
      <PageHeader title={t("admin.users.title")} description={t("admin.description")} />
      <UsersPanel />
    </AdminGuard>
  );
}
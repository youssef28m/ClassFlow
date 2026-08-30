"use client";

import { ArrowRight, Building2, MapPin, Phone, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { inputClassName } from "@/components/forms/field";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/tables/status-badge";
import { TablePagination } from "@/components/tables/table-pagination";
import { AdminGuard } from "@/features/admin/admin-guard";
import { useCentersQuery } from "@/features/centers/hooks";
import { useCenterScope } from "@/lib/center-scope";
import { useI18n } from "@/lib/i18n/provider";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const PAGE_SIZE = 10;

export default function AdminOverviewPage() {
  const { t, tEnum } = useI18n();
  const router = useRouter();
  const { centerId, setCenterId } = useCenterScope();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchText);

  const centers = useCentersQuery({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
  });

  const hasFilters = searchText.trim() !== "";

  function enterCenter(id: number) {
    setCenterId(id);
    router.push("/dashboard");
  }

  const pagination = useMemo(() => centers.data?.meta, [centers.data]);

  return (
    <AdminGuard>
      <PageHeader title={t("admin.title")} description={t("admin.description")} />

      {centerId !== null ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {t("admin.overview.currentlyIn", { id: centerId })}
          </p>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("admin.overview.goToCenter")}
          </Link>
          <button
            type="button"
            onClick={() => setCenterId(null)}
            className="ms-auto text-sm font-medium text-muted-foreground transition-colors hover:text-card-foreground"
          >
            {t("nav.exitCenter")}
          </button>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="admin-center-search"
            type="search"
            placeholder={t("centers.searchPlaceholder")}
            value={searchText}
            onChange={(event) => {
              setPage(1);
              setSearchText(event.target.value);
            }}
            className={`${inputClassName} ps-9`}
          />
        </div>
        {pagination ? (
          <p className="ms-auto text-sm tabular-nums text-muted-foreground">
            {t("table.totalCount", { count: pagination.total })}
          </p>
        ) : null}
      </div>

      {centers.isLoading && !centers.data ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : centers.error || !centers.data ? (
        <EmptyState
          icon={Building2}
          title={t("admin.overview.loadError")}
          description={t("admin.overview.loadErrorDescription")}
        />
      ) : centers.data.items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? t("centers.emptyFiltered") : t("centers.empty")}
          description={t("centers.emptyDescription")}
        />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {centers.data.items.map((center) => (
              <li key={center.id}>
                <button
                  type="button"
                  disabled={!center.active}
                  onClick={() => enterCenter(center.id)}
                  className="group flex w-full items-center gap-4 px-4 py-3 text-start transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Building2 className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-card-foreground">
                      {center.name}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {center.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" aria-hidden />
                          {center.phone}
                        </span>
                      ) : null}
                      {center.address ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden />
                          {center.address}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <StatusBadge tone={center.active ? "success" : "neutral"}>
                    {tEnum(center.active ? "ACTIVE" : "INACTIVE")}
                  </StatusBadge>
                  {center.active ? (
                    <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors group-hover:border-primary sm:flex">
                      <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>

          {centers.data.meta.totalPages > 0 ? (
            <TablePagination
              page={centers.data.meta.page}
              totalPages={centers.data.meta.totalPages}
              total={centers.data.meta.total}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}
    </AdminGuard>
  );
}
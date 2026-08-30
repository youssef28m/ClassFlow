"use client";

import { useMemo, useState } from "react";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/forms/searchable-select";
import { useCentersQuery } from "@/features/centers/hooks";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useI18n } from "@/lib/i18n/provider";

interface CenterSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Searchable center picker backed by the backend search, so it stays usable
 * even with hundreds of centers (no giant dropdown).
 */
export function CenterSelect({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  className,
}: CenterSelectProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());

  const centers = useCentersQuery({
    page: 1,
    pageSize: 25,
    search: debouncedSearch || undefined,
  });

  const options = useMemo<SearchableSelectOption[]>(
    () =>
      (centers.data?.items ?? []).map((center) => ({
        value: String(center.id),
        label: center.name,
        hint: center.address || undefined,
      })),
    [centers.data],
  );

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      onSearch={setSearch}
      loading={centers.isLoading || centers.isFetching}
      placeholder={placeholder ?? t("users.selectCenterPlaceholder")}
      searchPlaceholder={searchPlaceholder ?? t("users.searchCenterPlaceholder")}
      emptyText={emptyText ?? t("users.noCentersFound")}
      disabled={disabled}
      className={className}
    />
  );
}
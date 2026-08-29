"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

interface ExportButtonsProps {
  onExportCsv: () => void;
  onExportPdf: () => void;
  isExporting?: boolean;
}

export function ExportButtons({
  onExportCsv,
  onExportPdf,
  isExporting = false,
}: ExportButtonsProps) {
  const { t } = useI18n();
  const buttonClassName =
    "flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60";

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onExportCsv}
        disabled={isExporting}
        className={buttonClassName}
      >
        {isExporting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Download className="size-4" aria-hidden />
        )}
        {t("export.csv")}
      </button>
      <button type="button" onClick={onExportPdf} className={buttonClassName}>
        <FileText className="size-4" aria-hidden />
        {t("export.pdf")}
      </button>
    </div>
  );
}
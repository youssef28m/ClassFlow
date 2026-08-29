export interface PrintMetaItem {
  label: string;
  value: string;
}

export interface PrintSection {
  heading?: string;
  table?: {
    headers: string[];
    rows: Array<Array<string | number>>;
  };
}

function escapeCsvCell(value: string | number): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function downloadCSV(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
): void {
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPrintDocument(
  title: string,
  subtitle: string,
  meta: PrintMetaItem[],
  sections: PrintSection[],
): string {
  const dir = document.documentElement.dir === "rtl" ? "rtl" : "ltr";
  const lang = document.documentElement.lang || "en";
  const metaHtml =
    meta.length > 0
      ? `<div class="meta">${meta
          .map(
            (item) =>
              `<span><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</span>`,
          )
          .join("")}</div>`
      : "";
  const sectionsHtml = sections
    .map((section) => {
      const heading = section.heading
        ? `<h2>${escapeHtml(section.heading)}</h2>`
        : "";
      const table = section.table
        ? `<table><thead><tr>${section.table.headers
            .map((header) => `<th>${escapeHtml(header)}</th>`)
            .join("")}</tr></thead><tbody>${section.table.rows
            .map(
              (row) =>
                `<tr>${row
                  .map((cell) => {
                    const classes =
                      typeof cell === "number" ? ' class="num"' : "";
                    return `<td${classes}>${escapeHtml(cell)}</td>`;
                  })
                  .join("")}</tr>`,
            )
            .join("")}</tbody></table>`
        : "";
      return `<section>${heading}${table}</section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="${escapeHtml(lang)}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #111827; padding: 32px; margin: 0; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  .subtitle { color: #6b7280; font-size: 13px; margin: 0 0 16px; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px 24px; font-size: 13px; color: #374151; margin-bottom: 20px; }
  section { margin-bottom: 24px; }
  h2 { font-size: 14px; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: start; vertical-align: top; }
  th { background: #f3f4f6; font-weight: 600; }
  .num { text-align: end; white-space: nowrap; font-variant-numeric: tabular-nums; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p class="subtitle">${escapeHtml(subtitle)}</p>
${metaHtml}
${sectionsHtml}
</body>
</html>`;
}

/**
 * Opens a new window and prints its content. The window is opened
 * synchronously (inside the click handler) so browsers don't treat it as a
 * blocked popup; pass an already-opened `win` for flows that need to fetch
 * data first.
 */
export function openPrintWindow(
  title: string,
  subtitle: string,
  meta: PrintMetaItem[],
  sections: PrintSection[],
  win?: Window | null,
): void {
  const target = win ?? window.open("", "_blank");
  if (!target) return;

  target.document.open();
  target.document.write(
    buildPrintDocument(title, subtitle, meta, sections),
  );
  target.document.close();

  // Let the popup lay out before blocking on the print dialog.
  window.setTimeout(() => {
    target.focus();
    target.print();
  }, 150);
}
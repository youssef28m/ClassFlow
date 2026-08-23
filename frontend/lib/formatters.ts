let formatterLocale = "en-GB";

export function setFormatterLocale(locale: string): void {
  formatterLocale = locale === "ar" ? "ar-EG" : "en-GB";
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(formatterLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatSlotTime(value: string): string {
  const match = /T(\d{2}):(\d{2})/.exec(value);
  if (!match) return value;
  const hours24 = Number(match[1]);
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${match[2]} ${period}`;
}

export function humanizeEnum(value: string): string {
  const spaced = value.toLowerCase().replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

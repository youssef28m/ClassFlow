import type { ReactNode } from "react";

export const inputClassName =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-card-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20";

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-card-foreground"
      >
        {label}
        {hint ? (
          <span className="font-normal text-muted-foreground"> {hint}</span>
        ) : null}
      </label>
      {children}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

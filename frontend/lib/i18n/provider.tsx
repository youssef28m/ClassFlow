"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { dictionaries, interpolate, type Locale, type TranslationKey } from "@/lib/i18n/dictionary";
import { setFormatterLocale } from "@/lib/formatters";

const STORAGE_KEY = "classflow.locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** Translate an enum value like "MONDAY" or "PRESENT" via `enum.` / `day.` keys, falling back to the raw value. */
  tEnum: (value: string) => string;
}

let currentLocale: Locale = "en";
if (typeof window !== "undefined") {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "ar" || stored === "en") {
    currentLocale = stored;
  } else if (navigator.language.toLowerCase().startsWith("ar")) {
    currentLocale = "ar";
  }
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Locale {
  return currentLocale;
}

function getServerSnapshot(): Locale {
  return "en";
}

function writeLocale(next: Locale): void {
  currentLocale = next;
  for (const listener of listeners) listener();
}

const LanguageContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    setFormatterLocale(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    writeLocale(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string =>
      interpolate(dictionaries[locale][key] ?? dictionaries.en[key], vars),
    [locale],
  );

  const tEnum = useCallback(
    (value: string): string => {
      const dayKey = `day.${value}` as TranslationKey;
      if (dictionaries[locale][dayKey]) return dictionaries[locale][dayKey];
      const enumKey = `enum.${value}` as TranslationKey;
      if (dictionaries[locale][enumKey]) return dictionaries[locale][enumKey];
      const roleKey = `role.${value}` as TranslationKey;
      if (dictionaries[locale][roleKey]) return dictionaries[locale][roleKey];
      return value;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t, tEnum }), [locale, setLocale, t, tEnum]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useI18n must be used within a LanguageProvider");
  return context;
}

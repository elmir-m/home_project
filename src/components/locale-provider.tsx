"use client";

import { createContext, useContext } from "react";
import { translate, type Locale } from "@/lib/i18n";

const LocaleContext = createContext<Locale>("bs");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

// Hook koji vraća `t` funkciju vezanu za trenutni jezik.
export function useT() {
  const locale = useContext(LocaleContext);
  return (key: string, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
}

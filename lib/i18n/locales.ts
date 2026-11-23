/** Supported UI locales. Spanish is the canonical CONTENT language; the UI defaults to English. */
export const LOCALES = ["es", "en", "fr", "pt-BR", "it", "de", "ar", "zh-Hans", "hi", "ru", "uk", "tr"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";
export const CANONICAL_CONTENT_LOCALE: AppLocale = "es";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_INFO: Record<AppLocale, { nativeName: string; rtl: boolean }> = {
  es: { nativeName: "Español", rtl: false },
  en: { nativeName: "English", rtl: false },
  fr: { nativeName: "Français", rtl: false },
  "pt-BR": { nativeName: "Português (Brasil)", rtl: false },
  it: { nativeName: "Italiano", rtl: false },
  de: { nativeName: "Deutsch", rtl: false },
  ar: { nativeName: "العربية", rtl: true },
  "zh-Hans": { nativeName: "简体中文", rtl: false },
  hi: { nativeName: "हिन्दी", rtl: false },
  ru: { nativeName: "Русский", rtl: false },
  uk: { nativeName: "Українська", rtl: false },
  tr: { nativeName: "Türkçe", rtl: false },
};

export function isLocale(v: string | undefined | null): v is AppLocale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}

export function isRtl(locale: string): boolean {
  return isLocale(locale) && LOCALE_INFO[locale].rtl;
}

/** Best supported locale for an Accept-Language header (exact tag, then base language). */
export function matchAcceptLanguage(header: string | null | undefined): AppLocale | null {
  if (!header) return null;
  const tags = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.trim(), q: q ? Number(q) : 1 };
    })
    .filter((t) => t.tag && !Number.isNaN(t.q))
    .sort((a, b) => b.q - a.q);
  for (const { tag } of tags) {
    const exact = LOCALES.find((l) => l.toLowerCase() === tag.toLowerCase());
    if (exact) return exact;
    const base = tag.split("-")[0].toLowerCase();
    if (base === "zh") return "zh-Hans";
    if (base === "pt") return "pt-BR";
    const byBase = LOCALES.find((l) => l.split("-")[0].toLowerCase() === base);
    if (byBase) return byBase;
  }
  return null;
}

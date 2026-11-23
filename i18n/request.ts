import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, matchAcceptLanguage, type AppLocale } from "@/lib/i18n/locales";

/**
 * next-intl without i18n routing: the locale comes from the NEXT_LOCALE cookie,
 * then the Accept-Language header, then English. URLs stay the same for every locale.
 */
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  let locale: AppLocale = DEFAULT_LOCALE;
  if (isLocale(cookieLocale)) locale = cookieLocale;
  // Until screens are translated (UX session), only an explicit choice switches the UI language; Accept-Language is ready below.
  else locale = process.env.NEXT_PUBLIC_I18N_AUTODETECT === "1" ? (matchAcceptLanguage((await headers()).get("accept-language")) ?? DEFAULT_LOCALE) : DEFAULT_LOCALE;

  const messages = (await import(`../messages/${locale}.json`)).default;
  // English fills any key a translation does not have yet.
  const fallback = locale === "en" ? messages : (await import("../messages/en.json")).default;
  return {
    locale,
    messages: deepMerge(fallback, messages),
    onError: () => {},
    getMessageFallback: ({ namespace, key }) => [namespace, key].filter(Boolean).join("."),
  };
});

type Msgs = { [k: string]: string | Msgs };
function deepMerge(base: Msgs, over: Msgs): Msgs {
  const out: Msgs = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = typeof v === "object" && typeof base[k] === "object" ? deepMerge(base[k] as Msgs, v) : v;
  }
  return out;
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_INFO } from "@/lib/i18n/locales";

/** Language picker. Writes the NEXT_LOCALE cookie and re-renders the server tree. Placement is up to the screens. */
export default function LocaleSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("locale");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className={`inline-flex items-center gap-2 text-[13px] ${className}`}>
      <span className="text-ink-3">{t("label")}</span>
      <select
        value={locale}
        disabled={pending}
        aria-label={t("label")}
        onChange={(e) => {
          const next = e.target.value;
          document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=31536000; samesite=lax`;
          startTransition(() => router.refresh());
        }}
        className="rounded-full border border-line bg-card px-3 py-1.5 text-ink"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l} dir={LOCALE_INFO[l].rtl ? "rtl" : "ltr"}>
            {LOCALE_INFO[l].nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}

import type { Metadata, Viewport } from "next";
import { Archivo, Reenie_Beanie } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import AppShell from "@/components/AppShell";
import VoiceAgentMount from "@/components/VoiceAgentMount";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { isRtl } from "@/lib/i18n/locales";

// One family across the app (DESIGN.md); scripts Archivo lacks (Arabic, Devanagari, Han, Cyrillic) fall back to the system UI font.
const archivo = Archivo({ subsets: ["latin", "latin-ext"], axes: ["wdth"], variable: "--font-archivo" });
const hand = Reenie_Beanie({ subsets: ["latin"], weight: "400", variable: "--font-reenie" });

export const metadata: Metadata = {
  title: "Nomad – You move. We handle the paperwork.",
  description: "Personalised arrival checklist, verified answers and local help for students and interns moving abroad.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className={`${archivo.variable} ${hand.variable}`}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProvider>
            <AppShell>{children}</AppShell>
            <VoiceAgentMount />
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Instrument_Serif, Reenie_Beanie } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import AppShell from "@/components/AppShell";
import VoiceAgentMount from "@/components/VoiceAgentMount";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
const hand = Reenie_Beanie({ subsets: ["latin"], weight: "400", variable: "--font-reenie" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "Arrival – You move. We handle the paperwork.",
  description: "Personalised arrival checklist, verified answers and local help for students and interns moving abroad.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${hand.variable} ${instrument.variable} ${plexMono.variable}`}>
      <body className="font-sans antialiased">
        <AppProvider>
          <AppShell>{children}</AppShell>
          <VoiceAgentMount />
        </AppProvider>
      </body>
    </html>
  );
}

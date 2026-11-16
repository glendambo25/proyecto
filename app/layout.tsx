import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import AppShell from "@/components/AppShell";
import VoiceAgentMount from "@/components/VoiceAgentMount";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
  title: "Arrival – You move. We handle the paperwork.",
  description: "Personalised arrival checklist, verified answers and local help for students and interns moving abroad.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0f5c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="font-sans antialiased">
        <AppProvider>
          <AppShell>{children}</AppShell>
          <VoiceAgentMount />
        </AppProvider>
      </body>
    </html>
  );
}

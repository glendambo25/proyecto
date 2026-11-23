import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// next-intl without locale routing: request config lives in ./i18n/request.ts
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// GitHub Pages build (.github/workflows/pages.yml): static export served from /<repo>.
const isStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isStatic ? { output: "export" as const, basePath, images: { unoptimized: true } } : {}),
};

export default withNextIntl(nextConfig);

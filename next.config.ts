import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// next-intl without locale routing: request config lives in ./i18n/request.ts
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Hides the dev-mode "N" badge so it does not show during live demos (npm run dev).
  devIndicators: false,
};

export default withNextIntl(nextConfig);

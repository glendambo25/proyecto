/**
 * Build target. The GitHub Pages build is a static export (no server): API routes and the proxy are
 * left out, the assistant answers offline in the browser and the voice agent (needs a server-side
 * OpenAI key) is hidden. Everything else, including Supabase login and PostHog, works the same.
 */
export const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
/** Path prefix when served from a sub-path (GitHub Pages: /proyecto). Next adds it to links; use it for raw asset URLs. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

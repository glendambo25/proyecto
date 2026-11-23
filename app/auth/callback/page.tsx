"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";

/**
 * Magic-link (and future SSO) landing. Runs in the browser so it also works on static hosting:
 * the Supabase client exchanges the ?code= (PKCE) and stores the session in cookies.
 */
export default function AuthCallback() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const sb = getBrowserSupabase();
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") ?? "/home";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/home";
    if (!sb) {
      setFailed(true);
      return;
    }
    (async () => {
      let { data } = await sb.auth.getSession();
      const code = params.get("code");
      if (!data.session && code) {
        const r = await sb.auth.exchangeCodeForSession(code);
        data = { session: r.data.session };
      }
      track("login_completed", { ok: !!data.session });
      if (data.session) router.replace(safeNext);
      else setFailed(true);
    })();
  }, [router]);

  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
      {failed ? (
        <p className="text-ink-2">
          This sign-in link has expired or was already used.{" "}
          <Link className="font-semibold text-accent underline" href="/login">
            Request a new one
          </Link>
          .
        </p>
      ) : (
        <p className="text-ink-2">Signing you in…</p>
      )}
    </main>
  );
}

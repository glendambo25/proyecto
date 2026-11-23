"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import { BASE_PATH } from "@/lib/runtime";

function Login() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(params.get("error") ? "error" : "idle");
  const supabase = getBrowserSupabase();

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !email.trim()) return;
    setState("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${BASE_PATH}/auth/callback` },
    });
    setState(error ? "error" : "sent");
    track("login_link_requested", { ok: !error });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col px-6 pt-16 font-ui">
      <h1 className="text-[28px] font-semibold tracking-[-0.015em]">Sign in to Nomad</h1>
      <p className="mt-2 text-[15px] text-ink-2">We send a one-time link to your email. No password needed. Universities with single sign-on will use their own login here.</p>

      {!supabase ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-4 text-[14px] text-ink-2">
          Sign-in is not configured on this build yet (no EU database keys). Everything works in local demo mode.
          <Link href="/onboarding" className="mt-3 flex items-center gap-1.5 font-semibold text-accent">
            Continue in demo mode <ArrowRight size={15} />
          </Link>
        </div>
      ) : state === "sent" ? (
        <p className="mt-8 rounded-2xl border border-line p-4 text-[15px]">
          Check your inbox: we sent a sign-in link to <b>{email}</b>. It opens Nomad already signed in.
        </p>
      ) : (
        <form onSubmit={send} className="mt-8 space-y-3">
          <label className="block">
            <span className="text-[13px] font-medium text-ink-2">University or personal email</span>
            <span className="mt-2 flex items-center gap-2 rounded-2xl border border-line bg-card px-4 py-3.5 focus-within:border-accent">
              <Mail size={16} className="text-ink-3" />
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 bg-transparent text-[16px] outline-none" placeholder="name@university.edu" />
            </span>
          </label>
          <button disabled={state === "sending"} className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-accent disabled:cursor-wait">
            {state === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
          {state === "error" && <p className="text-[14px] text-stamp">The link could not be sent or has expired. Check the address and try again.</p>}
        </form>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}

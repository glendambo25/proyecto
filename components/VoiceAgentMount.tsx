"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { APP_NAME, formatDate, getDestination, isBlocked } from "@/lib/content";
import { statusOf, useApp } from "@/lib/store";
import { useFlag } from "@/lib/flags";
import { DEMO_QUESTIONS, isDemoMode } from "@/lib/demo";

declare global {
  interface Window {
    VoiceAgentConfig?: Record<string, unknown>;
    VoiceAgent?: { start: () => void; stop: () => void };
  }
}

/**
 * Mounts the voice agent from voice-agent-kit (public/voice-agent.js) with the app's pages,
 * the router for navigation, and two app tools that keep it grounded in the verified content.
 */
export default function VoiceAgentMount() {
  const voiceOn = useFlag("voice_agent");
  const router = useRouter();
  const app = useApp();
  const ref = useRef(app);
  ref.current = app;
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    /** Ask /api/assistant (live Claude → demo cache → offline verified answer) and mirror it in the assistant chat. */
    const askVerified = async (question: string) => {
      const { profile, statuses, addAssistant, setHighlighted, log } = ref.current;
      if (!profile) throw new Error("no profile yet");
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, destinationId: profile.destinationId, nationality: profile.nationality, purpose: profile.purpose, statuses }),
      });
      const j = await r.json();
      addAssistant({ role: "user", text: `🎙️ ${question}` });
      addAssistant({ role: "assistant", text: j.answer, sources: j.sources, covered: j.covered, offline: j.offline, cached: j.cached });
      if (j.missingTaskIds?.length) setHighlighted(j.missingTaskIds);
      log("assistant_question", { channel: "voice", covered: j.covered });
      return j;
    };
    window.VoiceAgentConfig = {
      language: "en",
      name: `${APP_NAME} voice assistant`,
      speak: "Speak English.",
      navigate: (url: string) => router.push(url),
      context:
        "Arrival helps students, interns and workers moving abroad with their paperwork: a personalised checklist in the right order (with dependencies), each step with its official source and last-verified date, a 24/7 assistant, local mentors and a city guide.",
      pages: [
        { url: "/home", title: "Home", description: "Greeting, overall progress and the list of steps with their status" },
        { url: "/tasks", title: "Tasks", description: "Full checklist in order, the dependency map (what unlocks what) and return reminders" },
        { url: "/city", title: "City", description: "Map, places, transport times and the housing scam alert" },
        { url: "/chat", title: "Chats", description: "International office, local mentor, accommodation, job board, paperwork advisor" },
        { url: "/chat/assistant", title: "AI assistant", description: "Text assistant that answers with official source and date" },
        { url: "/profile", title: "Profile", description: "Personal details, destination, documents, preferences, demo profile switch" },
        { url: "/plans", title: "Plans", description: "Free, Premium pack and Done for you (prices are hypotheses)" },
        { url: "/deadlines", title: "Deadlines", description: "Legal deadlines estimated from the arrival date, with calendar export" },
        { url: "/kit", title: "Local kit", description: "Starter kit for the city: transport pass, bank account, padron, SIM (partner offers are demo)" },
        { url: "/office", title: "Office view", description: "University view: cohort progress and students at risk" },
      ],
      rules: [
        "For any question about requirements, documents, deadlines, costs, offices or order of steps, ALWAYS call ask_verified_assistant and answer only from its result. If it returns covered=false, say you don't have a verified official source for this yet and offer an advisor.",
        "When you give a fact from ask_verified_assistant, name the official source and the last-verified date in a few words (do not read URLs).",
        "To know what the user has done or still has to do, call get_my_checklist.",
        "To open a specific step, go to /tasks/<id> with an id from get_my_checklist.",
      ],
      tools: [
        {
          definition: {
            name: "get_my_checklist",
            description: "Get the user's personalised checklist: each step with id, status, what it needs first and its deadline.",
            parameters: { type: "object", properties: {} },
          },
          run: async () => {
            const { profile, checklist, statuses } = ref.current;
            if (!profile) return { ok: false, error: "no profile yet: the user is on onboarding" };
            const d = getDestination(profile.destinationId);
            return {
              ok: true,
              user: profile.name,
              destination: `${d.city}, ${d.country}`,
              steps: checklist.map((t) => ({
                id: t.id,
                title: t.title,
                localName: t.localName,
                status: statusOf(statuses, t.id),
                blocked: isBlocked(t, statuses),
                needsFirst: t.dependsOn,
                deadline: t.deadline,
                phase: t.phase,
              })),
            };
          },
        },
        {
          definition: {
            name: "ask_verified_assistant",
            description:
              "Ask the verified-content assistant a question about the user's paperwork. Returns an answer grounded in official sources with names and last-verified dates, and flags missing steps in the checklist.",
            parameters: { type: "object", properties: { question: { type: "string" } }, required: ["question"] },
          },
          run: async ({ question }: { question: string }) => {
            if (!ref.current.profile) return { ok: false, error: "no profile yet" };
            const j = await askVerified(question);
            return {
              ok: true,
              answer: j.answer,
              covered: j.covered,
              sources: (j.sources ?? []).map((s: { name: string; lastVerified: string | null; verificationStatus: string }) => ({
                name: s.name,
                lastVerified: s.lastVerified ? formatDate(s.lastVerified) : "not verified yet",
                verified: s.verificationStatus === "verified",
              })),
              markedMissing: j.missingTaskIds,
            };
          },
        },
      ],
      // DEMO MODE (lib/demo.ts): never hang on stage. If Realtime can't connect in 9 s, the panel switches to a
      // SIMULATED voice (browser speech) that answers with the same verified assistant (/api/assistant).
      demo: () => isDemoMode(),
      connectTimeoutMs: 9000,
      fallback: async (question: string) => {
        const j = await askVerified(question);
        const src = (j.sources ?? [])[0] as { name: string; lastVerified: string | null } | undefined;
        return src ? `${j.answer}

Source: ${src.name}${src.lastVerified ? `, checked ${formatDate(src.lastVerified)}` : ""}.` : j.answer;
      },
      fallbackSuggestions: [DEMO_QUESTIONS.voice, "What should I do next?"],
      onEvent: (e: { type: string }) => ref.current.log(`voice_${e.type}`),
    };
    setConfigured(true);
  }, [router]);

  if (!configured || !voiceOn) return null;
  return <Script src="/voice-agent.js" strategy="afterInteractive" />;
}

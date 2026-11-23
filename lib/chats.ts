import type { Destination } from "./types";

export type ChatFilter = "All" | "Uni" | "City" | "Work";

export interface Thread {
  id: string;
  name: string;
  role: string;
  group: Exclude<ChatFilter, "All">;
  avatar: string;
  time: string;
  unread?: number;
  messages: { from: "them" | "me"; text: string }[];
}

/** Sample conversations (fictional, for the demo). Adapted to the destination city. */
export function threadsFor(d: Destination, institution: string): Thread[] {
  const italy = d.country === "Italy";
  return [
    {
      id: "intl-office",
      name: "International Office",
      role: institution,
      group: "Uni",
      avatar: "🎓",
      time: "09:12",
      unread: 1,
      messages: [
        { from: "them", text: `Welcome to ${d.city}! Please check in with us during your first week with your passport or ID and your learning agreement.` },
        { from: "me", text: "Thanks! Can I book the check-in online?" },
        { from: "them", text: "Yes, through the student portal. If you get stuck, reply here." },
      ],
    },
    {
      id: "mentor",
      name: italy ? "Giulia" : "Local mentor",
      role: "Local mentor",
      group: "City",
      avatar: "🙋‍♀️",
      time: "Yesterday",
      messages: [
        { from: "them", text: `${italy ? "Ciao" : d.country === "Spain" ? "¡Hola" : "Hi"}! I did my exchange two years ago and now I live in ${d.city}. Ask me anything about neighbourhoods or day-to-day life.` },
        { from: "me", text: "Which area is good and close to the university?" },
        { from: "them", text: "Check the City tab: I added my favourite places and how long it takes to get there." },
      ],
    },
    {
      id: "accommodation",
      name: italy ? "Marco" : "Housing desk",
      role: "Accommodation",
      group: "City",
      avatar: "🏠",
      time: "Mon",
      messages: [
        { from: "them", text: "I saw you're looking for a room. Before you pay anything, go through the scam checklist in the app." },
        { from: "me", text: "Someone asked me for the deposit before a viewing…" },
        { from: "them", text: "That's a red flag. Ask for a live video viewing and a contract first." },
      ],
    },
    {
      id: "jobs",
      name: `${d.city} job board`,
      role: "Part-time jobs & internships",
      group: "Work",
      avatar: "💼",
      time: "Sun",
      messages: [{ from: "them", text: "New this week: 3 student jobs and 1 internship. Check the requirements for your nationality before applying." }],
    },
    {
      id: "students",
      name: italy && d.id === "turin" ? "PoliTo Students" : "Exchange students",
      role: "Community",
      group: "Uni",
      avatar: "👥",
      time: "Sat",
      messages: [
        { from: "them", text: "Welcome drinks on Friday at 19:00! 🍕" },
        { from: "them", text: "Which insurance did people choose? Share your experience here." },
      ],
    },
    {
      id: "advisor",
      name: "Paperwork advisor",
      role: "Partner advisor",
      group: "Work",
      avatar: "📑",
      time: "Fri",
      messages: italy
        ? [
            { from: "them", text: "For the permesso di soggiorno, keep your codice fiscale certificate with your other documents; I can review your file before the appointment." },
            { from: "me", text: "Great, thanks." },
          ]
        : [{ from: "them", text: "I can review your documents before your appointment. Send me what you have." }],
    },
  ];
}

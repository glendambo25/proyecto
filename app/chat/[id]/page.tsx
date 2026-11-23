import { destinations } from "@/lib/content";
import { threadsFor } from "@/lib/chats";
import Thread from "./Thread";

/** Thread ids are the same for every destination and institution; listed so the static export can prerender them. */
export function generateStaticParams() {
  return [...new Set(destinations.flatMap((d) => threadsFor(d, "").map((t) => t.id)))].map((id) => ({ id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Thread id={(await params).id} />;
}

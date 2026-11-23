import { destinations } from "@/lib/content";
import TaskDetail from "./TaskDetail";

/** Every step id across destinations, so the static export can prerender each step page. */
export function generateStaticParams() {
  return [...new Set(destinations.flatMap((d) => d.tasks.map((t) => t.id)))].map((id) => ({ id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <TaskDetail id={(await params).id} />;
}

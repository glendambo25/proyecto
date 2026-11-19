"use client";

import TasksChart from "@/components/chart/TasksChart";
import TasksMinimal from "@/components/TasksMinimal";
import { useDesign } from "@/lib/design";

export default function Tasks() {
  const [variant] = useDesign();
  return variant === "minimal" ? <TasksMinimal /> : <TasksChart />;
}

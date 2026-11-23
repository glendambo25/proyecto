"use client";

import StepView from "@/components/StepView";
import { useDesign } from "@/lib/design";

export default function TaskDetail({ id }: { id: string }) {
  const [variant] = useDesign();
  return <StepView id={id} variant={variant} />;
}

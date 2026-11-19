"use client";

import { use } from "react";
import StepView from "@/components/StepView";
import { useDesign } from "@/lib/design";

export default function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [variant] = useDesign();
  return <StepView id={id} variant={variant} />;
}

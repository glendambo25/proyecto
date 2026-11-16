"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";

export default function Index() {
  const { ready, profile } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (ready) router.replace(profile ? "/home" : "/onboarding");
  }, [ready, profile, router]);
  return null;
}

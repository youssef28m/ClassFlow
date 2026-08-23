"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AttendanceIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/groups");
  }, [router]);

  return (
    <p className="text-sm text-muted-foreground">Redirecting to groups…</p>
  );
}

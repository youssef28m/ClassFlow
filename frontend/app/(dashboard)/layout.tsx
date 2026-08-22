import { RequireAuth } from "@/features/auth/components/require-auth";
import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <RequireAuth>{children}</RequireAuth>;
}

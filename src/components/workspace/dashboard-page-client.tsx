"use client";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { EditorDashboard } from "@/components/dashboard/editor-dashboard";
import { useConsoleUser } from "@/components/providers/console-user-provider";

export function DashboardPageClient() {
  const user = useConsoleUser();

  return user.role === "ADMIN" ? (
    <AdminDashboard user={user} />
  ) : (
    <EditorDashboard user={user} />
  );
}

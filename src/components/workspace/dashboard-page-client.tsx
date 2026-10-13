"use client";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { useConsoleUser } from "@/components/providers/console-user-provider";
import { EditorDashboard } from "@/components/dashboard/editor-dashboard";

export function DashboardPageClient() {
  const user = useConsoleUser();

  return user.role === "ADMIN" ? (
    <AdminDashboard user={user} />
  ) : (
    <EditorDashboard user={user} />
  );
}

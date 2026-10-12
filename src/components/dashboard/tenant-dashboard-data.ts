"use client";

import { useQuery } from "@apollo/client/react";
import { TENANT_DASHBOARD_QUERY } from "@/lib/apollo/operations";

export function useTenantDashboardData() {
  return useQuery(TENANT_DASHBOARD_QUERY, { fetchPolicy: "cache-first" });
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
}

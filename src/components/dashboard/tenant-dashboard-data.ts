"use client";

import { TENANT_DASHBOARD_QUERY } from "@/lib/apollo/operations";
import { useQuery } from "@apollo/client/react";

export function useTenantDashboardData() {
  const query = useQuery(TENANT_DASHBOARD_QUERY);

  return {
    ...query,
    initialLoading: query.loading && !query.data?.tenantDashboard,
  };
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
}

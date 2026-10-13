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

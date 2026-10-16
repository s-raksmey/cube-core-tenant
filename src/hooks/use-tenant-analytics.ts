"use client";

import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";
import type { AnalyticsPeriod } from "@/lib/apollo/generated/graphql";
import { TENANT_ANALYTICS_QUERY } from "@/lib/apollo/operations";
import { useQuery } from "@apollo/client/react";
import { useState } from "react";

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 29 * 86_400_000)
  .toISOString()
  .slice(0, 10);

export function useTenantAnalytics() {
  const permissions = useTenantUserPermissions();
  const allowed =
    permissions.canViewTenantAnalytics || permissions.canViewOwnAnalytics;
  const [period, setPeriod] = useState<AnalyticsPeriod>("LAST_30_DAYS");
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const valid =
    period !== "CUSTOM" || (Boolean(from && to) && from <= to && to <= today);
  const query = useQuery(TENANT_ANALYTICS_QUERY, {
    variables: {
      range: { period, ...(period === "CUSTOM" ? { from, to } : {}) },
    },
    skip: !allowed || !valid,
    fetchPolicy: "cache-and-network",
  });
  return {
    ...query,
    permissions,
    allowed,
    valid,
    period,
    setPeriod,
    from,
    setFrom,
    to,
    setTo,
    analytics: allowed && valid ? query.data?.tenantAnalytics : undefined,
  };
}

"use client";

import { TENANT_AUDIT_LOGS_QUERY } from "@/lib/apollo/operations";
import type { TenantAuditLogsQuery } from "@/lib/apollo/generated/graphql";
import type { TenantAuditLogPage } from "@/types/audit-log.types";
import { useQuery } from "@apollo/client/react";
import { useState } from "react";

const PAGE_SIZE = 10;

/** Owns the tenant-scoped audit query and stable page-to-page loading state. */
export function useTenantAuditLogs() {
  const [requestedPage, setPage] = useState(1);
  const query = useQuery<TenantAuditLogsQuery>(TENANT_AUDIT_LOGS_QUERY, {
    variables: { page: requestedPage },
  });
  const pageData: TenantAuditLogPage | undefined =
    query.data?.tenantAuditLogs ?? query.previousData?.tenantAuditLogs;
  const total = pageData?.total ?? 0;
  const page = pageData?.page ?? requestedPage;
  const pageSize = pageData?.pageSize ?? PAGE_SIZE;

  return {
    ...query,
    page,
    pageSize,
    total,
    logs: pageData?.items ?? [],
    initialLoading: query.loading && !pageData,
    blockingError: Boolean(query.error && !pageData),
    canPrev: page > 1,
    canNext: page * pageSize < total,
    setPage,
    refresh: () => query.refetch({ page: requestedPage }),
  };
}

export type TenantAuditLogs = ReturnType<typeof useTenantAuditLogs>;

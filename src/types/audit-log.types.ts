import type { TenantAuditLogsQuery } from "@/lib/apollo/generated/graphql";

export type TenantAuditLogRow =
  TenantAuditLogsQuery["tenantAuditLogs"]["items"][number];

export type TenantAuditLogPage = TenantAuditLogsQuery["tenantAuditLogs"];

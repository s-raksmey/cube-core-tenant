"use client";

import { TENANT_ROLE_PERMISSION_SUMMARY_QUERY } from "@/lib/apollo/operations";
import { useQuery } from "@apollo/client/react";

export type TenantPermissionRole = "ADMIN" | "EDITOR";

export function useTenantRolePermissionSummary() {
  const query = useQuery(TENANT_ROLE_PERMISSION_SUMMARY_QUERY);
  const permissionsByRole = new Map(
    (query.data?.tenantRolePermissionSummary ?? []).map((role) => [
      role.role as TenantPermissionRole,
      new Set(role.permissions),
    ]),
  );
  return { ...query, permissionsByRole };
}

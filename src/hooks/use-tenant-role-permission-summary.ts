"use client";

import { TENANT_ROLE_PERMISSION_SUMMARY_QUERY } from "@/lib/apollo/operations";
import type { TenantPermissionRole } from "@/types/role-permission.types";
import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";

/** Reads the Main Console permission configuration for the active tenant. */
export function useTenantRolePermissionSummary() {
  const query = useQuery(TENANT_ROLE_PERMISSION_SUMMARY_QUERY);
  const permissionsByRole = useMemo(
    () =>
      new Map(
        (query.data?.tenantRolePermissionSummary ?? []).map((role) => [
          role.role as TenantPermissionRole,
          new Set(role.permissions),
        ]),
      ),
    [query.data?.tenantRolePermissionSummary],
  );

  return { ...query, permissionsByRole };
}

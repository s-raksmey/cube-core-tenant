"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { TenantPermissionSummaryCard } from "@/components/roles/tenant-permission-summary-card";
import { useTenantRolePermissionSummary } from "@/hooks/use-tenant-role-permission-summary";
import {
  TENANT_SETTINGS_PERMISSION_ROWS,
  TENANT_USER_PERMISSION_ROWS,
} from "@/types/role-permission.types";

export function TenantRolePermissionsPanel() {
  const { data, loading, error, permissionsByRole } =
    useTenantRolePermissionSummary();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles & Permissions"
        description="Review the user-management permissions configured by your SuperAdmin."
        crumbs={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Roles & Permissions" },
        ]}
      />
      {loading && !data ? (
        <p className="text-sm text-muted-foreground">
          Loading role permissions…
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive">
          Unable to load role permissions.
        </p>
      ) : null}
      <TenantPermissionSummaryCard
        title="User Management"
        rows={TENANT_USER_PERMISSION_ROWS}
        permissionsByRole={permissionsByRole}
      />
      <TenantPermissionSummaryCard
        title="Sub-tenant Settings"
        rows={TENANT_SETTINGS_PERMISSION_ROWS}
        permissionsByRole={permissionsByRole}
      />
    </div>
  );
}

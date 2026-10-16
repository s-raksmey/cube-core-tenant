"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { TenantPermissionSummaryCard } from "@/components/roles/tenant-permission-summary-card";
import { useTenantRolePermissionSummary } from "@/hooks/use-tenant-role-permission-summary";
import {
  TENANT_ANALYTICS_PERMISSION_ROWS,
  TENANT_ARTICLE_PERMISSION_ROWS,
  TENANT_CATEGORY_PERMISSION_ROWS,
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
        description="Review the workspace permissions configured by your SuperAdmin."
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
        description="Site settings cover General, Website maintenance and branding, Social Links, SEO, and Content (Breaking duration). Managed in the Main Console."
        rows={TENANT_SETTINGS_PERMISSION_ROWS}
        permissionsByRole={permissionsByRole}
      />
      <TenantPermissionSummaryCard
        title="Categories & Tags"
        rows={TENANT_CATEGORY_PERMISSION_ROWS}
        permissionsByRole={permissionsByRole}
      />
      <TenantPermissionSummaryCard
        title="Articles"
        rows={TENANT_ARTICLE_PERMISSION_ROWS}
        permissionsByRole={permissionsByRole}
      />
      <TenantPermissionSummaryCard
        title="Analytics"
        rows={TENANT_ANALYTICS_PERMISSION_ROWS}
        permissionsByRole={permissionsByRole}
      />
    </div>
  );
}

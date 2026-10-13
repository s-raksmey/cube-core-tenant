"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { TenantUsersPanel } from "@/components/users/tenant-users-panel";

export function UsersPageClient() {
  const header = (
    <PageHeader
      title="User Management"
      description="Manage Admin and Editor users authorized to access this tenant console."
      crumbs={[{ label: "Workspace", href: "/dashboard" }, { label: "Users" }]}
    />
  );

  return (
    <div>
      {header}
      <TenantUsersPanel />
    </div>
  );
}

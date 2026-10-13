"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { TenantUsersPanel } from "@/components/users/tenant-users-panel";
import { ME_QUERY } from "@/lib/apollo/operations";
import { useQuery } from "@apollo/client/react";

export function UsersPageClient() {
  const { data, loading, error } = useQuery(ME_QUERY);
  const header = (
    <PageHeader
      title="User Management"
      description="Manage Admin and Editor users authorized to access this tenant console."
      crumbs={[{ label: "Workspace", href: "/dashboard" }, { label: "Users" }]}
    />
  );

  if (loading) {
    return (
      <div>
        {header}
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error || !data?.me) {
    return (
      <div>
        {header}
        <p className="text-sm text-destructive">Unable to load session.</p>
      </div>
    );
  }

  return (
    <div>
      {header}
      <TenantUsersPanel viewer={data.me} />
    </div>
  );
}

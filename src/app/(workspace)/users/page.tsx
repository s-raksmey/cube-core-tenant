"use client";

import { useQuery } from "@apollo/client/react";
import { ME_QUERY } from "@/lib/apollo/operations";
import { PageHeader } from "@/components/dashboard/page-header";
import { TenantUsersPanel } from "@/components/users/tenant-users-panel";

export default function UsersPage() {
  const { data, loading, error } = useQuery(ME_QUERY);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Users"
          description="Manage Admin, Editor, and Author memberships for this tenant."
          crumbs={[
            { label: "Workspace", href: "/dashboard" },
            { label: "Users" },
          ]}
        />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error || !data?.me) {
    return (
      <div>
        <PageHeader
          title="Users"
          description="Manage Admin, Editor, and Author memberships for this tenant."
          crumbs={[
            { label: "Workspace", href: "/dashboard" },
            { label: "Users" },
          ]}
        />
        <p className="text-sm text-destructive">Unable to load session.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage Admin, Editor, and Author memberships for this tenant."
        crumbs={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Users" },
        ]}
      />
      <TenantUsersPanel viewer={data.me} />
    </div>
  );
}

"use client";

import { useQuery } from "@apollo/client/react";
import { ME_QUERY } from "@/lib/graphql/operations";
import { TenantDashboard } from "@/components/dashboard/tenant-dashboard";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuthUser } from "@/lib/types";

type MeData = { me: AuthUser | null };

export default function DashboardPage() {
  const { data, loading } = useQuery<MeData>(ME_QUERY);
  const user = data?.me;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    return (
      <EmptyState
        title="Sign in required"
        description="Only sub-tenant Admin or Editor accounts can access this workspace."
      />
    );
  }

  return <TenantDashboard user={user} />;
}

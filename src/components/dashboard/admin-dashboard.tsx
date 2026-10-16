"use client";

import { EmptyState } from "@/components/dashboard/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { TenantDashboardCharts } from "@/components/dashboard/tenant-dashboard-charts";
import { TenantLandingHero } from "@/components/dashboard/tenant-landing-hero";
import { Button } from "@/components/ui/button";
import { useTenantDashboardData } from "@/hooks/use-tenant-dashboard-data";
import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";
import type { AuthUser } from "@/lib/types";
import { FileText, ScanEye, Share2, ShieldCheck, Users } from "lucide-react";

export function AdminDashboard({ user }: { user: AuthUser }) {
  const { data, error, refetch, initialLoading } = useTenantDashboardData();
  const { canViewUsers, canViewTenantAnalytics, canViewOwnAnalytics } =
    useTenantUserPermissions();
  const canViewAnalytics = canViewTenantAnalytics || canViewOwnAnalytics;
  const dashboard = data?.tenantDashboard;
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user.tenant.name} Administration`}
        description="Manage the tenant workspace, users, and publishing activity."
        crumbs={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Admin Dashboard" },
        ]}
      />
      <TenantLandingHero user={user} />
      {error ? (
        <EmptyState
          title="Unable to load tenant dashboard"
          description={error.message}
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {canViewUsers ? (
          <KpiCard
            title="Total Users"
            value={dashboard?.totalUsers ?? 0}
            hint={`${dashboard?.activeUsers ?? 0} active`}
            icon={Users}
            loading={initialLoading}
          />
        ) : null}
        {canViewAnalytics ? (
          <KpiCard
            title="Published Content"
            value={dashboard?.publishedContent ?? 0}
            hint="Currently published articles"
            icon={FileText}
            loading={initialLoading}
          />
        ) : null}
        {canViewAnalytics ? (
          <KpiCard
            title="Article views · 6 months"
            value={
              dashboard?.viewsByMonth.reduce(
                (sum, item) => sum + item.count,
                0,
              ) ?? 0
            }
            icon={ScanEye}
            loading={initialLoading}
          />
        ) : null}
        {canViewAnalytics ? (
          <KpiCard
            title="Share actions · 6 months"
            value={
              dashboard?.sharesByMonth.reduce(
                (sum, item) => sum + item.count,
                0,
              ) ?? 0
            }
            icon={Share2}
            loading={initialLoading}
          />
        ) : null}
        <KpiCard
          title="Tenant Status"
          value={dashboard?.tenant.status ?? user.tenant.status}
          icon={ShieldCheck}
          loading={initialLoading}
        />
      </div>
      {canViewAnalytics ? (
        <TenantDashboardCharts
          dashboard={dashboard}
          loading={initialLoading}
          own={!canViewTenantAnalytics}
        />
      ) : null}
    </div>
  );
}

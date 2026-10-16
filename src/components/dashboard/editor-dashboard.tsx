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
import { FileText, ScanEye, Share2 } from "lucide-react";
import Link from "next/link";

export function EditorDashboard({ user }: { user: AuthUser }) {
  const { data, error, refetch, initialLoading } = useTenantDashboardData();
  const { canViewTenantAnalytics, canViewOwnAnalytics } =
    useTenantUserPermissions();
  const canViewAnalytics = canViewTenantAnalytics || canViewOwnAnalytics;
  const dashboard = data?.tenantDashboard;
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user.tenant.name} Workspace`}
        description="Create and manage content for this tenant."
        crumbs={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Editor Dashboard" },
        ]}
      />
      <TenantLandingHero user={user} />
      {error ? (
        <EmptyState
          title="Unable to load workspace dashboard"
          description={error.message}
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : null}
      <section className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm font-medium text-primary">Editor workspace</p>
        <h2 className="mt-1 text-xl font-semibold">Ready to publish?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create content and upload media for {user.tenant.name}.
        </p>
        <div className="mt-4 flex gap-2">
          <Button asChild>
            <Link href="/content">Create Content</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/media">Upload Media</Link>
          </Button>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
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

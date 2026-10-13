"use client";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ChartPanel } from "@/components/dashboard/chart-panel";
import { EmptyState } from "@/components/dashboard/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { useTenantDashboardData } from "@/hooks/use-tenant-dashboard-data";
import { formatBytes } from "@/lib/format-bytes";
import { TenantLandingHero } from "@/components/dashboard/tenant-landing-hero";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuthUser } from "@/lib/types";
import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";
import { FileText, HardDrive, ShieldCheck, Users } from "lucide-react";

export function AdminDashboard({ user }: { user: AuthUser }) {
  const { data, error, refetch, initialLoading } = useTenantDashboardData();
  const { canViewUsers } = useTenantUserPermissions();
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
        <KpiCard
          title="Published Content"
          value={dashboard?.publishedContent ?? 0}
          hint="Content module not implemented yet"
          icon={FileText}
          loading={initialLoading}
        />
        <KpiCard
          title="Media Storage"
          value={formatBytes(dashboard?.mediaStorageBytes ?? 0)}
          hint="Media module not implemented yet"
          icon={HardDrive}
          loading={initialLoading}
        />
        <KpiCard
          title="Tenant Status"
          value={dashboard?.tenant.status ?? user.tenant.status}
          icon={ShieldCheck}
          loading={initialLoading}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          title="Content activity over time"
          loading={initialLoading}
          emptyLabel="No content activity yet."
          points={(dashboard?.contentActivityByMonth ?? []).map((item) => ({
            label: item.month.slice(5),
            value: item.count,
          }))}
        />
        <ChartPanel
          title="Content by status"
          loading={initialLoading}
          emptyLabel="No content distribution yet."
          points={(dashboard?.contentByStatus ?? []).map((item) => ({
            label: item.status,
            value: item.count,
          }))}
        />
      </div>
      <div
        className={`grid gap-4 ${canViewUsers ? "xl:grid-cols-[1.4fr_1fr]" : ""}`}
      >
        {canViewUsers ? (
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-4">
              <h3 className="font-semibold">Recent users</h3>
            </div>
            {initialLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            ) : (dashboard?.recentUsers.length ?? 0) === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No users in this tenant"
                  description="Invite teammates from the Users module."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard?.recentUsers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.email}
                      </TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>
                        <StatusBadge status={member.status ?? "UNKNOWN"} />
                      </TableCell>
                      <TableCell>
                        {member.createdAt
                          ? new Date(member.createdAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ) : null}
        <ActivityFeed
          title="Recent tenant activity"
          loading={initialLoading}
          items={dashboard?.recentActivity ?? []}
        />
      </div>
    </div>
  );
}

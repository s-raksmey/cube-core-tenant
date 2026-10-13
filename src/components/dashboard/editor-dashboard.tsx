"use client";

import { FileText, HardDrive } from "lucide-react";
import Link from "next/link";
import type { AuthUser } from "@/lib/types";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ChartPanel } from "@/components/dashboard/chart-panel";
import { EmptyState } from "@/components/dashboard/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatBytes, useTenantDashboardData } from "@/components/dashboard/tenant-dashboard-data";
import { Button } from "@/components/ui/button";
import { TenantLandingHero } from "@/components/dashboard/tenant-landing-hero";

export function EditorDashboard({ user }: { user: AuthUser }) {
  const { data, error, refetch, initialLoading } = useTenantDashboardData();
  const dashboard = data?.tenantDashboard;
  return <div className="space-y-6">
    <PageHeader title={`${user.tenant.name} Workspace`} description="Create and manage content for this tenant." crumbs={[{ label: "Workspace", href: "/dashboard" }, { label: "Editor Dashboard" }]} />
    <TenantLandingHero user={user} />
    {error ? <EmptyState title="Unable to load workspace dashboard" description={error.message} action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} /> : null}
    <section className="rounded-2xl border border-border bg-card p-6"><p className="text-sm font-medium text-primary">Editor workspace</p><h2 className="mt-1 text-xl font-semibold">Ready to publish?</h2><p className="mt-2 text-sm text-muted-foreground">Create content and upload media for {user.tenant.name}.</p><div className="mt-4 flex gap-2"><Button asChild><Link href="/content">Create Content</Link></Button><Button variant="outline" asChild><Link href="/media">Upload Media</Link></Button></div></section>
    <div className="grid gap-4 sm:grid-cols-2"><KpiCard title="Published Content" value={dashboard?.publishedContent ?? 0} hint="Content module not implemented yet" icon={FileText} loading={initialLoading} /><KpiCard title="Media Storage" value={formatBytes(dashboard?.mediaStorageBytes ?? 0)} hint="Media module not implemented yet" icon={HardDrive} loading={initialLoading} /></div>
    <div className="grid gap-4 lg:grid-cols-2"><ChartPanel title="Content activity over time" loading={initialLoading} emptyLabel="No content activity yet." points={(dashboard?.contentActivityByMonth ?? []).map((item) => ({ label: item.month.slice(5), value: item.count }))} /><ChartPanel title="Content by status" loading={initialLoading} emptyLabel="No content distribution yet." points={(dashboard?.contentByStatus ?? []).map((item) => ({ label: item.status, value: item.count }))} /></div>
    <ActivityFeed title="Recent workspace activity" loading={initialLoading} items={dashboard?.recentActivity ?? []} />
  </div>;
}

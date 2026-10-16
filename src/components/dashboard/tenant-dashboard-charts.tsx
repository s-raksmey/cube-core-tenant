import { ChartPanel } from "@/components/dashboard/chart-panel";
import type { TenantDashboardQuery } from "@/lib/apollo/generated/graphql";

type Dashboard = TenantDashboardQuery["tenantDashboard"];

export function TenantDashboardCharts({
  dashboard,
  loading,
  own,
}: {
  dashboard?: Dashboard;
  loading: boolean;
  own: boolean;
}) {
  const points = (rows: { month: string; count: number }[] = []) =>
    rows.map((item) => ({ label: item.month, value: item.count }));
  return (
    <section
      aria-label="Article and audience trends"
      className="grid gap-4 lg:grid-cols-2"
    >
      <ChartPanel
        title={`${own ? "My article publishing" : "Article publishing"} · 6 months (UTC)`}
        loading={loading}
        emptyLabel="No articles published in the last 6 months."
        points={points(dashboard?.contentActivityByMonth)}
      />
      <ChartPanel
        title={
          own ? "My articles by current status" : "Articles by current status"
        }
        variant="bars"
        loading={loading}
        emptyLabel="No articles yet."
        points={(dashboard?.contentByStatus ?? []).map((item) => ({
          label: item.status,
          value: item.count,
        }))}
      />
      <ChartPanel
        title={`${own ? "My article views" : "Article views"} · 6 months (UTC)`}
        loading={loading}
        emptyLabel="No article views in the last 6 months."
        points={points(dashboard?.viewsByMonth)}
      />
      <ChartPanel
        title={`${own ? "My share actions" : "Share actions"} · 6 months (UTC)`}
        loading={loading}
        emptyLabel="No share actions in the last 6 months."
        points={points(dashboard?.sharesByMonth)}
      />
    </section>
  );
}

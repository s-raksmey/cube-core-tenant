"use client";

import { AnalyticsTable } from "@/components/analytics/analytics-table";
import { ChartPanel } from "@/components/dashboard/chart-panel";
import { EmptyState } from "@/components/dashboard/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTenantAnalytics } from "@/hooks/use-tenant-analytics";
import type {
  AnalyticsPeriod,
  TenantAnalyticsQuery,
} from "@/lib/apollo/generated/graphql";
import {
  Activity,
  CalendarDays,
  FileText,
  ScanEye,
  Send,
  Share2,
} from "lucide-react";
import { useState } from "react";

type Analytics = TenantAnalyticsQuery["tenantAnalytics"];
type Tab =
  | "overview"
  | "content"
  | "audience"
  | "editorial"
  | "myContent"
  | "myAudience";

const periods: { value: AnalyticsPeriod; label: string }[] = [
  { value: "LAST_7_DAYS", label: "Last 7 days" },
  { value: "LAST_30_DAYS", label: "Last 30 days" },
  { value: "LAST_90_DAYS", label: "Last 90 days" },
  { value: "LAST_180_DAYS", label: "Last 180 days" },
  { value: "LAST_365_DAYS", label: "Last 365 days" },
  { value: "CUSTOM", label: "Custom range" },
];

function count(data: Analytics, status: string) {
  return data.statusCounts.find((item) => item.name === status)?.count ?? 0;
}

function comparison(metric: Analytics["views"]) {
  return `Previous period: ${metric.previousValue.toLocaleString()}${metric.percentChange === null ? "" : ` · ${metric.percentChange > 0 ? "+" : ""}${metric.percentChange}%`}`;
}

function AnalyticsChart({
  title,
  points,
  empty,
}: {
  title: string;
  points: Analytics["viewsOverTime"];
  empty: string;
}) {
  return (
    <ChartPanel
      title={title}
      points={points.map((point) => ({
        label: point.date,
        value: point.value,
      }))}
      emptyLabel={empty}
    />
  );
}

function Overview({ data }: { data: Analytics }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Views this period"
          value={data.views.value}
          hint={comparison(data.views)}
          icon={ScanEye}
        />
        <KpiCard
          title="Share actions this period"
          value={data.shares.value}
          hint={comparison(data.shares)}
          icon={Share2}
        />
        <KpiCard
          title="Currently published"
          value={count(data, "PUBLISHED")}
          icon={FileText}
        />
        <KpiCard
          title="Last published this period"
          value={data.published.value}
          hint={comparison(data.published)}
          icon={Send}
        />
        <KpiCard
          title="In review now"
          value={count(data, "IN_REVIEW")}
          icon={Activity}
        />
        <KpiCard
          title="Scheduled now"
          value={count(data, "SCHEDULED")}
          icon={CalendarDays}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsChart
          title="Views over time (UTC)"
          points={data.viewsOverTime}
          empty="No view data for this period."
        />
        <AnalyticsTable title="Most viewed articles" rows={data.mostViewed} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsChart
          title="Article publishing activity (UTC)"
          points={data.publishingOverTime}
          empty="No articles published in this period."
        />
        <ChartPanel
          title="Articles by current status"
          variant="bars"
          points={data.statusCounts.map((item) => ({
            label: item.name,
            value: item.count,
          }))}
          emptyLabel="No articles yet."
        />
      </div>
    </div>
  );
}

function Content({ data }: { data: Analytics }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsTable title="Most viewed articles" rows={data.mostViewed} />
        <AnalyticsTable title="Most shared articles" rows={data.mostShared} />
        <AnalyticsTable title="Top categories" rows={data.categories} />
        <AnalyticsTable title="Top subcategories" rows={data.subcategories} />
        <AnalyticsTable title="Top tags" rows={data.tags} />
        <AnalyticsChart
          title="Published over time (UTC)"
          points={data.publishingOverTime}
          empty="No articles published in this period."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Breaking and Featured reflect current article flags; views and shares
          are recorded actions in the selected period.
        </p>
        {[
          { title: "Breaking articles", value: data.breaking },
          { title: "Featured articles", value: data.featured },
        ].map((item) => (
          <Card key={item.title} className="border-border shadow-none">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <strong className="block text-xl">
                  {item.value?.published ?? 0}
                </strong>
                Currently published
              </div>
              <div>
                <strong className="block text-xl">
                  {item.value?.views ?? 0}
                </strong>
                Views this period
              </div>
              <div>
                <strong className="block text-xl">
                  {item.value?.shares ?? 0}
                </strong>
                Shares this period
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Audience({ data }: { data: Analytics }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard
          title="Views this period"
          value={data.views.value}
          hint={comparison(data.views)}
          icon={ScanEye}
        />
        <KpiCard
          title="Share actions this period"
          value={data.shares.value}
          hint={comparison(data.shares)}
          icon={Share2}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsChart
          title="Views over time (UTC)"
          points={data.viewsOverTime}
          empty="No view data for this period."
        />
        <AnalyticsChart
          title="Share actions over time (UTC)"
          points={data.sharesOverTime}
          empty="No share data for this period."
        />
        <AnalyticsTable title="Most viewed articles" rows={data.mostViewed} />
        <AnalyticsTable title="Most shared articles" rows={data.mostShared} />
      </div>
      {data.scope === "TENANT" ? (
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle>Share actions by platform</CardTitle>
          </CardHeader>
          <CardContent>
            {data.sharePlatforms.length ? (
              <ul className="divide-y">
                {data.sharePlatforms.map((item) => (
                  <li
                    key={item.name}
                    className="flex justify-between py-2 text-sm"
                  >
                    <span>{item.name.replaceAll("_", " ")}</span>
                    <strong>{item.count.toLocaleString()}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No share actions in this period.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Editorial({ data }: { data: Analytics }) {
  const review = data.reviews;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {data.statusCounts.map((item) => (
          <KpiCard
            key={item.name}
            title={`${item.name.replaceAll("_", " ")} now`}
            value={item.count}
            icon={FileText}
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Submitted this period"
          value={review?.submitted ?? 0}
          icon={Send}
        />
        <KpiCard
          title="Changes requested"
          value={review?.changesRequested ?? 0}
          icon={Activity}
        />
        <KpiCard
          title="Waiting for review"
          value={review?.waiting ?? 0}
          icon={CalendarDays}
        />
        <KpiCard
          title="Average completed review cycle"
          value={
            review?.averageReviewHours === null ||
            review?.averageReviewHours === undefined
              ? "—"
              : `${review.averageReviewHours.toFixed(1)} h`
          }
          hint="Submission to decision, for cycles decided this period"
          icon={CalendarDays}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsChart
          title="Published over time (UTC)"
          points={data.publishingOverTime}
          empty="No articles published in this period."
        />
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle>Author activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.authorActivity.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-96 text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2">Author</th>
                      <th>Created</th>
                      <th>Submitted</th>
                      <th>Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.authorActivity.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2">{item.name}</td>
                        <td>{item.created}</td>
                        <td>{item.submitted}</td>
                        <td>{item.published}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No author activity in this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MyContent({ data }: { data: Analytics }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="My articles"
          value={data.totalArticles}
          icon={FileText}
        />
        <KpiCard
          title="My last published this period"
          value={data.published.value}
          hint={comparison(data.published)}
          icon={Send}
        />
        {data.statusCounts
          .filter((item) => item.name !== "ARCHIVED")
          .map((item) => (
            <KpiCard
              key={item.name}
              title={`My ${item.name.toLowerCase().replaceAll("_", " ")}`}
              value={item.count}
              icon={FileText}
            />
          ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsChart
          title="My publishing activity (UTC)"
          points={data.publishingOverTime}
          empty="No articles published in this period."
        />
        <ChartPanel
          title="My articles by current status"
          variant="bars"
          points={data.statusCounts.map((item) => ({
            label: item.name,
            value: item.count,
          }))}
          emptyLabel="No articles yet."
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle>My recent articles</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentArticles.length ? (
              <ul className="divide-y">
                {data.recentArticles.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-3 py-2 text-sm"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {item.status.replaceAll("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No articles yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function TenantAnalyticsPage() {
  const {
    analytics,
    permissions,
    allowed,
    valid,
    loading,
    error,
    refetch,
    period,
    setPeriod,
    from,
    setFrom,
    to,
    setTo,
  } = useTenantAnalytics();
  const [tab, setTab] = useState<Tab>("overview");
  const own = analytics?.scope === "OWN";
  const activeTab = own
    ? tab === "myAudience"
      ? "myAudience"
      : "myContent"
    : ["overview", "content", "audience", "editorial"].includes(tab)
      ? tab
      : "overview";
  if (permissions.loading)
    return (
      <div className="space-y-5">
        <PageHeader
          title="Analytics"
          description="Content and audience performance for this workspace."
        />
        <p role="status" className="text-sm text-muted-foreground">
          Loading permissions…
        </p>
      </div>
    );
  if (permissions.error)
    return (
      <div className="space-y-5">
        <PageHeader
          title="Analytics"
          description="Content and audience performance for this workspace."
        />
        <EmptyState
          title="Unable to check analytics access"
          description="Please refresh the page and try again."
        />
      </div>
    );
  if (!allowed)
    return (
      <div className="space-y-5">
        <PageHeader
          title="Analytics"
          description="Content and audience performance for this workspace."
        />
        <EmptyState
          title="Analytics unavailable"
          description="Ask a Main administrator to grant your role an Analytics view permission."
        />
      </div>
    );
  const tabs: { id: Tab; label: string }[] = own
    ? [
        { id: "myContent", label: "My Content" },
        { id: "myAudience", label: "My Audience" },
      ]
    : [
        { id: "overview", label: "Overview" },
        { id: "content", label: "Content" },
        { id: "audience", label: "Audience" },
        { id: "editorial", label: "Editorial" },
      ];
  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        description={
          own
            ? "Performance of articles you authored."
            : "Content, audience, and editorial activity for this workspace."
        }
      />
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm font-medium">
          Period
          <select
            className="block h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value as AnalyticsPeriod)
            }
          >
            {periods.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {period === "CUSTOM" ? (
          <>
            <label className="space-y-1 text-sm">
              From (UTC)
              <Input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              To (UTC)
              <Input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
          </>
        ) : null}
      </div>
      {!valid ? (
        <p role="alert" className="text-sm text-destructive">
          Choose a valid UTC date range.
        </p>
      ) : null}
      {error && !analytics ? (
        <EmptyState
          title="Unable to load analytics"
          description="Try again after checking the connection."
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : null}
      {loading && !analytics ? (
        <div role="status" className="grid gap-4 sm:grid-cols-2">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : null}
      {analytics ? (
        <>
          <div
            role="tablist"
            aria-label="Analytics sections"
            className="flex flex-wrap gap-1 border-b"
          >
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activeTab === item.id}
                className={`border-b-2 px-4 py-2 text-sm font-medium ${activeTab === item.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {activeTab === "overview" && !own ? (
            <Overview data={analytics} />
          ) : null}
          {activeTab === "content" && !own ? (
            <Content data={analytics} />
          ) : null}
          {activeTab === "audience" && !own ? (
            <Audience data={analytics} />
          ) : null}
          {activeTab === "editorial" && !own ? (
            <Editorial data={analytics} />
          ) : null}
          {activeTab === "myContent" && own ? (
            <MyContent data={analytics} />
          ) : null}
          {activeTab === "myAudience" && own ? (
            <Audience data={analytics} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

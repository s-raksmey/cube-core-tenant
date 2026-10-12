import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DynamicRouteMarker } from "@/components/workspace/dynamic-route-marker";

export default function AuditPage() {
  return (
    <>
      <Suspense fallback={null}><DynamicRouteMarker /></Suspense>
      <div>
        <PageHeader title="Audit Logs" description="Tenant audit explorer placeholder." />
        <EmptyState
          title="Audit explorer coming next"
          description="Recent activity is already shown on the dashboard."
        />
      </div>
    </>
  );
}

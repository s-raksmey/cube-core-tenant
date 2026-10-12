import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DynamicRouteMarker } from "@/components/workspace/dynamic-route-marker";

export default function ContentPage() {
  return (
    <>
      <Suspense fallback={null}><DynamicRouteMarker /></Suspense>
      <div>
        <PageHeader title="Content" description="Content module is not implemented yet." />
        <EmptyState
          title="No content module yet"
          description="KPI and charts show zero until content is built."
        />
      </div>
    </>
  );
}

import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DynamicRouteMarker } from "@/components/workspace/dynamic-route-marker";

export default function SettingsPage() {
  return (
    <>
      <Suspense fallback={null}><DynamicRouteMarker /></Suspense>
      <div>
        <PageHeader title="Settings" description="Tenant settings placeholder for this MVP." />
        <EmptyState
          title="Settings coming next"
          description="Role-aware tenant settings will land in a later phase."
        />
      </div>
    </>
  );
}

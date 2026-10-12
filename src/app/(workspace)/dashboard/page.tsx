import { Suspense } from "react";
import { DashboardPageClient } from "@/components/workspace/dashboard-page-client";
import { DynamicRouteMarker } from "@/components/workspace/dynamic-route-marker";

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={null}>
        <DynamicRouteMarker />
      </Suspense>
      <DashboardPageClient />
    </>
  );
}

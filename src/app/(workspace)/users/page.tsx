import { Suspense } from "react";
import { DynamicRouteMarker } from "@/components/workspace/dynamic-route-marker";
import { UsersPageClient } from "@/components/workspace/users-page-client";

export default function UsersPage() {
  return (
    <>
      <Suspense fallback={null}>
        <DynamicRouteMarker />
      </Suspense>
      <UsersPageClient />
    </>
  );
}

import { Suspense } from "react";
import { TenantRolePermissionsPanel } from "@/components/roles/tenant-role-permissions-panel";
import { DynamicRouteMarker } from "@/components/workspace/dynamic-route-marker";

export default function RolesPage() {
  return (
    <>
      <Suspense fallback={null}><DynamicRouteMarker /></Suspense>
      <TenantRolePermissionsPanel />
    </>
  );
}

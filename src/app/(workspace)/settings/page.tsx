import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { TenantBrandingPanel } from "@/components/branding/tenant-branding-panel";
import { DynamicRouteMarker } from "@/components/workspace/dynamic-route-marker";

export default function SettingsPage() {
  return (
    <>
      <Suspense fallback={null}><DynamicRouteMarker /></Suspense>
      <div>
        <PageHeader title="Branding & SEO" description="Manage the visual identity and social sharing assets for this tenant." />
        <TenantBrandingPanel />
      </div>
    </>
  );
}

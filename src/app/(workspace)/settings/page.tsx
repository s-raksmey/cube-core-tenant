import { PageHeader } from "@/components/dashboard/page-header";
import { TenantBrandingPanel } from "@/components/branding/tenant-branding-panel";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Branding & SEO" description="Manage the visual identity and social sharing assets for this tenant." />
      <TenantBrandingPanel />
    </div>
  );
}

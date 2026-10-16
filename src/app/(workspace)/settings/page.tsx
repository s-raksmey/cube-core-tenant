import { PageHeader } from "@/components/dashboard/page-header";
import { TenantSettingsPanel } from "@/components/settings/tenant-settings-panel";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your website details and identity."
      />
      <TenantSettingsPanel />
    </div>
  );
}

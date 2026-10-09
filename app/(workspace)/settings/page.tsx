import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Tenant settings placeholder for this MVP." />
      <EmptyState
        title="Settings coming next"
        description="Role-aware tenant settings will land in a later phase."
      />
    </div>
  );
}

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";

export default function TagsPage() {
  return (
    <div>
      <PageHeader title="Tags" description="Organize and label workspace articles." />
      <EmptyState title="No tags yet" description="Tag management will appear here." />
    </div>
  );
}

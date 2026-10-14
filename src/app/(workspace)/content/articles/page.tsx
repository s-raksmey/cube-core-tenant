import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";

export default function ArticlesPage() {
  return (
    <div>
      <PageHeader title="Articles" description="Create and manage workspace articles." />
      <EmptyState title="No articles yet" description="Article management will appear here." />
    </div>
  );
}

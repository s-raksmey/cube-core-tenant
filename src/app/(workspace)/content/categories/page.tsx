import { CategoriesPanel } from "@/components/content/categories-panel";
import { PageHeader } from "@/components/dashboard/page-header";

export default function CategoriesPage() {
  return (
    <div>
      <PageHeader title="Categories" description="Organize workspace articles into categories." />
      <CategoriesPanel />
    </div>
  );
}

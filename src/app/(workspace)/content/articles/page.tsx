import { PageHeader } from "@/components/dashboard/page-header";
import { ArticlesList } from "@/components/content/articles-list";
import type { ArticleScope } from "@/lib/apollo/generated/graphql";

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const { scope } = await searchParams;
  const initialScope: ArticleScope = scope === "my" ? "MY" : scope === "review" ? "REVIEW" : "ALL";
  return <div><PageHeader title="Articles" description="Create, manage and publish workspace articles." /><ArticlesList initialScope={initialScope} /></div>;
}

import { ArticleDetail } from "@/components/content/article-detail";
export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleDetail id={id} />;
}

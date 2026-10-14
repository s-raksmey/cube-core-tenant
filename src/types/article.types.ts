import type { ArticleForEditQuery, CreateArticleInput } from "@/lib/apollo/generated/graphql";

export type ArticleEditData = NonNullable<ArticleForEditQuery["article"]>;
export type ArticleTranslationDraft = { locale: string; title: string; summary: string; content: string };
export type ArticleFormState = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  categoryId: string;
  subcategoryId: string;
  tagIds: string[];
  translations: ArticleTranslationDraft[];
  featuredImageUrl: string;
  isBreaking: boolean;
  isFeatured: boolean;
};

export const emptyArticleForm = (): ArticleFormState => ({
  title: "", slug: "", summary: "", content: "", categoryId: "", subcategoryId: "",
  tagIds: [], translations: [], featuredImageUrl: "", isBreaking: false, isFeatured: false,
});

export function articleToForm(article: ArticleEditData): ArticleFormState {
  return {
    title: article.title, slug: article.slug, summary: article.summary ?? "", content: article.content,
    categoryId: article.categoryId, subcategoryId: article.subcategoryId,
    tagIds: article.tags.map((tag) => tag.id),
    translations: article.translations.map((item) => ({ ...item, summary: item.summary ?? "" })),
    featuredImageUrl: article.featuredImageUrl ?? "", isBreaking: article.isBreaking, isFeatured: article.isFeatured,
  };
}

export function articleFormInput(form: ArticleFormState): CreateArticleInput {
  return {
    title: form.title.trim(), slug: form.slug.trim().toLowerCase(), summary: form.summary.trim() || null,
    content: form.content, categoryId: form.categoryId, subcategoryId: form.subcategoryId,
    tagIds: form.tagIds,
    translations: form.translations.map((item) => ({ locale: item.locale.toLowerCase(), title: item.title.trim(),
      summary: item.summary.trim() || null, content: item.content })),
    featuredImageUrl: form.featuredImageUrl.trim() || null,
  };
}

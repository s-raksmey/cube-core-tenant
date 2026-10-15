import type { ArticleStatus } from "@/lib/apollo/generated/graphql";
import type { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";

type Permissions = ReturnType<typeof useTenantUserPermissions>;
type ArticleState = { status: ArticleStatus; authorId: string | null };

export const isArticleContentEditable = (status: ArticleStatus) => status === "DRAFT";

export function articleActions(article: ArticleState, viewerId: string, permissions: Permissions) {
  const ownOrAny = permissions.canUpdateAnyArticle ||
    (article.authorId === viewerId && permissions.canUpdateOwnArticles);
  const draft = isArticleContentEditable(article.status);
  const inReview = article.status === "IN_REVIEW";
  const published = article.status === "PUBLISHED";
  const scheduled = article.status === "SCHEDULED";
  return {
    edit: draft && ownOrAny,
    delete: draft && (permissions.canDeleteAnyArticle ||
      (article.authorId === viewerId && permissions.canDeleteOwnArticles)),
    deleteArchived: article.status === "ARCHIVED" && permissions.canDeleteArchivedArticles,
    submit: draft && ownOrAny && permissions.canSubmitArticles,
    requestChanges: inReview && permissions.canReviewArticles,
    publish: (draft || inReview) && permissions.canPublishArticles,
    schedule: (draft || inReview) && permissions.canScheduleArticles,
    reschedule: scheduled && permissions.canScheduleArticles,
    cancelSchedule: scheduled && permissions.canScheduleArticles,
    unpublish: published && permissions.canUnpublishArticles,
    archive: draft && permissions.canArchiveArticles,
    restore: article.status === "ARCHIVED" && permissions.canRestoreArticles,
    breaking: draft && permissions.canSetBreakingArticles,
    featured: draft && permissions.canSetFeaturedArticles,
  };
}

import type { ArticleStatus } from "@/lib/apollo/generated/graphql";
import type { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";

type Permissions = ReturnType<typeof useTenantUserPermissions>;
type ArticleState = { status: ArticleStatus; authorId: string | null; authorRole: "ADMIN" | "EDITOR" | null };

export const isArticleContentEditable = (status: ArticleStatus) => status === "DRAFT";

export function articleActions(article: ArticleState, viewerId: string, viewerRole: string, permissions: Permissions) {
  const canManage = permissions.canViewArticles && (article.authorId === viewerId || viewerRole === "ADMIN" ||
    (viewerRole === "EDITOR" && article.authorRole === "EDITOR"));
  const ownOrAny = permissions.canUpdateAnyArticle ||
    (article.authorId === viewerId && permissions.canUpdateOwnArticles);
  const draft = isArticleContentEditable(article.status);
  const inReview = article.status === "IN_REVIEW";
  const published = article.status === "PUBLISHED";
  const scheduled = article.status === "SCHEDULED";
  const canSetPresentation = canManage && ((draft && ownOrAny) || ((inReview || scheduled) && permissions.canReviewArticles));
  const canSchedule = permissions.canScheduleArticles && permissions.canViewArticles;
  return {
    edit: canManage && draft && ownOrAny,
    delete: canManage && draft && (permissions.canDeleteAnyArticle ||
      (article.authorId === viewerId && permissions.canDeleteOwnArticles)),
    deleteArchived: canManage && article.status === "ARCHIVED" && permissions.canDeleteArchivedArticles,
    submit: canManage && draft && ownOrAny && permissions.canSubmitArticles,
    requestChanges: canManage && inReview && permissions.canViewArticles && permissions.canRequestArticleChanges &&
      (permissions.canReviewArticles || ownOrAny),
    publish: canManage && (draft || inReview) && permissions.canPublishArticles,
    schedule: canManage && canSchedule && ((draft && ownOrAny) || (inReview && permissions.canReviewArticles)),
    reschedule: canManage && canSchedule && scheduled && (ownOrAny || permissions.canReviewArticles),
    cancelSchedule: canManage && canSchedule && scheduled && (ownOrAny || permissions.canReviewArticles),
    unpublish: canManage && published && permissions.canUnpublishArticles,
    archive: canManage && draft && permissions.canViewArticles && ownOrAny && permissions.canArchiveArticles,
    restore: canManage && article.status === "ARCHIVED" && permissions.canRestoreArticles,
    breaking: canSetPresentation && permissions.canSetBreakingArticles,
    featured: canSetPresentation && permissions.canSetFeaturedArticles,
  };
}

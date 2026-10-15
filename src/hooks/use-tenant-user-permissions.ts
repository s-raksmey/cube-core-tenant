import { TENANT_USER_PERMISSIONS_QUERY } from "@/lib/apollo/operations";
import { useQuery } from "@apollo/client/react";

/** Loads tenant permissions once and exposes them as named capabilities. */
export function useTenantUserPermissions() {
  const query = useQuery(TENANT_USER_PERMISSIONS_QUERY);
  const permissions = new Set(query.data?.tenantUserPermissions ?? []);
  return {
    ...query,
    canViewUsers: permissions.has("USERS_VIEW"),
    canCreateUsers: permissions.has("USERS_CREATE"),
    canEditUsers: permissions.has("USERS_EDIT"),
    canChangeRoles: permissions.has("USERS_CHANGE_ROLE"),
    canActivateUsers: permissions.has("USERS_ACTIVATE"),
    canResetPasswords: permissions.has("USERS_RESET_PASSWORD"),
    canSuspendUsers: permissions.has("USERS_SUSPEND"),
    canDeleteUsers: permissions.has("USERS_DELETE"),
    canViewBranding: permissions.has("BRANDING_VIEW"),
    canViewTags: permissions.has("TAG_VIEW"),
    canCreateTags: permissions.has("TAG_CREATE"),
    canEditTags: permissions.has("TAG_EDIT"),
    canDeleteTags: permissions.has("TAG_DELETE"),
    canViewCategories: permissions.has("CATEGORY_VIEW"),
    canViewSubcategories: permissions.has("CATEGORY_VIEW_SUBCATEGORY"),
    canCreateCategories: permissions.has("CATEGORY_CREATE"),
    canCreateSubcategories: permissions.has("CATEGORY_CREATE_SUBCATEGORY"),
    canEditCategories: permissions.has("CATEGORY_EDIT"),
    canEditSubcategories: permissions.has("CATEGORY_EDIT_SUBCATEGORY"),
    canDeleteCategories: permissions.has("CATEGORY_DELETE"),
    canDeleteSubcategories: permissions.has("CATEGORY_DELETE_SUBCATEGORY"),
    canUpdateBranding: permissions.has("BRANDING_UPDATE"),
    canViewArticles: permissions.has("ARTICLE_VIEW"),
    canCreateArticles: permissions.has("ARTICLE_CREATE"),
    canUpdateOwnArticles: permissions.has("ARTICLE_UPDATE_OWN"),
    canUpdateAnyArticle: permissions.has("ARTICLE_UPDATE_ANY"),
    canDeleteOwnArticles: permissions.has("ARTICLE_DELETE_OWN"),
    canDeleteAnyArticle: permissions.has("ARTICLE_DELETE_ANY"),
    canDeleteArchivedArticles: permissions.has("ARTICLE_DELETE_ARCHIVED"),
    canSubmitArticles: permissions.has("ARTICLE_SUBMIT"),
    canReviewArticles: permissions.has("ARTICLE_REVIEW"),
    canPublishArticles: permissions.has("ARTICLE_PUBLISH"),
    canUnpublishArticles: permissions.has("ARTICLE_UNPUBLISH"),
    canScheduleArticles: permissions.has("ARTICLE_SCHEDULE"),
    canArchiveArticles: permissions.has("ARTICLE_ARCHIVE"),
    canRestoreArticles: permissions.has("ARTICLE_RESTORE"),
    canSetBreakingArticles: permissions.has("ARTICLE_SET_BREAKING"),
    canSetFeaturedArticles: permissions.has("ARTICLE_SET_FEATURED"),
  };
}

export const TENANT_USER_PERMISSION_ROWS = [
  ["USERS_VIEW", "View users"],
  ["USERS_CREATE", "Create users"],
  ["USERS_EDIT", "Edit users"],
  ["USERS_CHANGE_ROLE", "Change user roles"],
  ["USERS_ACTIVATE", "Activate users"],
  ["USERS_SUSPEND", "Suspend users"],
  ["USERS_RESET_PASSWORD", "Reset password"],
  ["USERS_DELETE", "Delete users"],
] as const;

export const TENANT_SETTINGS_PERMISSION_ROWS = [
  ["SETTINGS_VIEW", "View site settings"],
  ["SETTINGS_UPDATE", "Edit site settings"],
] as const;

export const TENANT_ANALYTICS_PERMISSION_ROWS = [
  ["ANALYTICS_VIEW_TENANT", "View tenant analytics"],
  ["ANALYTICS_VIEW_OWN", "View own analytics"],
] as const;

export const TENANT_CATEGORY_PERMISSION_ROWS = [
  ["CATEGORY_VIEW", "View category"],
  ["CATEGORY_VIEW_SUBCATEGORY", "View sub category"],
  ["CATEGORY_CREATE", "Create category"],
  ["CATEGORY_CREATE_SUBCATEGORY", "Create sub category"],
  ["CATEGORY_EDIT", "Edit category"],
  ["CATEGORY_EDIT_SUBCATEGORY", "Edit sub category"],
  ["CATEGORY_DELETE", "Delete category"],
  ["CATEGORY_DELETE_SUBCATEGORY", "Delete sub category"],
  ["TAG_VIEW", "View tags"],
  ["TAG_CREATE", "Create tags"],
  ["TAG_EDIT", "Edit tags"],
  ["TAG_DELETE", "Delete tags"],
] as const;

export const TENANT_ARTICLE_PERMISSION_ROWS = [
  ["ARTICLE_VIEW", "View articles"],
  ["ARTICLE_CREATE", "Create articles"],
  ["ARTICLE_UPDATE_OWN", "Edit own articles"],
  ["ARTICLE_UPDATE_ANY", "Edit any article"],
  ["ARTICLE_DELETE_OWN", "Delete own drafts"],
  ["ARTICLE_DELETE_ANY", "Delete any draft"],
  ["ARTICLE_DELETE_ARCHIVED", "Permanently delete archived articles"],
  ["ARTICLE_SUBMIT", "Submit for review"],
  ["ARTICLE_REVIEW", "Review articles"],
  ["ARTICLE_REQUEST_CHANGES", "Request article changes"],
  ["ARTICLE_PUBLISH", "Publish articles"],
  ["ARTICLE_UNPUBLISH", "Unpublish articles"],
  ["ARTICLE_SCHEDULE", "Schedule articles"],
  ["ARTICLE_ARCHIVE", "Archive articles"],
  ["ARTICLE_RESTORE", "Restore articles"],
  ["ARTICLE_SET_BREAKING", "Set breaking news"],
  ["ARTICLE_SET_FEATURED", "Set featured articles"],
] as const;

export const TENANT_PERMISSION_ROLES = ["ADMIN", "EDITOR"] as const;

export type TenantPermissionRole = (typeof TENANT_PERMISSION_ROLES)[number];

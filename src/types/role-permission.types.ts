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
  ["BRANDING_VIEW", "View settings"],
  ["BRANDING_UPDATE", "Edit settings"],
] as const;

export const TENANT_PERMISSION_ROLES = ["ADMIN", "EDITOR"] as const;

export type TenantPermissionRole = (typeof TENANT_PERMISSION_ROLES)[number];

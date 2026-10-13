import type { SubTenantRole } from "@/lib/types";

export type TenantUserRow = {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  email: string;
  role: string;
  status: string | null;
  membershipStatus: string | null;
  totpEnabled: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
};

export type TenantUserActions = {
  canEditUsers: boolean;
  canChangeRoles: boolean;
  canActivateUsers: boolean;
  canSuspendUsers: boolean;
  canResetPasswords: boolean;
  canDeleteUsers: boolean;
};

export type TenantUserEditTarget = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: SubTenantRole;
  status: string | null;
  membershipStatus: string | null;
};

export type TenantUserDeleteTarget = {
  id: string;
  username: string | null;
  email: string;
  role: string;
};

export type TenantUserLinkTarget = {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  status?: string | null;
};

export type TenantUserLinkResult = {
  url: string;
  expiresAt: string;
  label: string;
};

"use client";

import type { TenantUserDialogState } from "@/hooks/use-tenant-user-dialog-state";
import type { TenantUsersList } from "@/hooks/use-tenant-users";
import {
  CREATE_TENANT_USER,
  DELETE_TENANT_USER,
  GENERATE_TENANT_USER_ACTIVATION,
  GENERATE_TENANT_USER_PASSWORD_RESET,
  TENANT_USER_ACTIVATION_LINK,
  TENANT_USER_PASSWORD_RESET_LINK,
  UPDATE_TENANT_USER,
} from "@/lib/apollo/operations";
import type { TenantUserLinkTarget } from "@/types/tenant-user.types";
import { useLazyQuery, useMutation } from "@apollo/client/react";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/** Owns tenant-user mutations and secure activation/reset-link workflows. */
export function useTenantUserActions({
  viewerId,
  canChangeRoles,
  canSuspendUsers,
  dialogs,
  list,
  onResetConfirmation,
}: {
  viewerId: string;
  canChangeRoles: boolean;
  canSuspendUsers: boolean;
  dialogs: TenantUserDialogState;
  list: TenantUsersList;
  onResetConfirmation: (user: {
    id: string;
    email: string;
    fullName: string | null;
  }) => void;
}) {
  const [createUser, { loading: creating }] = useMutation(CREATE_TENANT_USER);
  const [updateUser, { loading: updating }] = useMutation(UPDATE_TENANT_USER);
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_TENANT_USER);
  const [generateActivation, { loading: regenerating }] = useMutation(
    GENERATE_TENANT_USER_ACTIVATION,
  );
  const [generateReset, { loading: resetting }] = useMutation(
    GENERATE_TENANT_USER_PASSWORD_RESET,
  );
  const [loadActivationLink, { loading: loadingActivationLink }] = useLazyQuery(
    TENANT_USER_ACTIVATION_LINK,
    { fetchPolicy: "no-cache" },
  );
  const [loadResetLink, { loading: loadingResetLink }] = useLazyQuery(
    TENANT_USER_PASSWORD_RESET_LINK,
    { fetchPolicy: "no-cache" },
  );

  async function requestPasswordReset(user: {
    id: string;
    email: string;
    fullName: string | null;
  }) {
    dialogs.setFormError(null);
    try {
      const result = await loadResetLink({ variables: { userId: user.id } });
      const link = result.data?.tenantUserPasswordResetLink;
      if (link) {
        dialogs.setLinkResult({
          url: link.resetUrl,
          expiresAt: link.expiresAt,
          label: `Password reset link for ${user.email}`,
        });
      } else {
        onResetConfirmation(user);
      }
    } catch (error) {
      dialogs.setFormError(
        errorMessage(error, "Could not check password reset link"),
      );
    }
  }

  async function saveUser() {
    dialogs.setFormError(null);
    try {
      if (dialogs.editTarget) {
        await updateUser({
          variables: {
            id: dialogs.editTarget.id,
            input: {
              firstName: dialogs.firstName,
              lastName: dialogs.lastName,
              email: dialogs.email,
              ...(dialogs.editTarget.id === viewerId || !canChangeRoles
                ? {}
                : { role: dialogs.role }),
              ...(dialogs.editTarget.id === viewerId ||
              !canSuspendUsers ||
              dialogs.accountStatus ===
                (dialogs.editTarget.membershipStatus === "DISABLED"
                  ? "INACTIVE"
                  : "ACTIVE")
                ? {}
                : { suspended: dialogs.accountStatus === "INACTIVE" }),
            },
          },
        });
        dialogs.setCreateOpen(false);
        dialogs.setEditTarget(null);
        await list.refetch();
        return;
      }

      const result = await createUser({
        variables: {
          firstName: dialogs.firstName,
          lastName: dialogs.lastName,
          email: dialogs.email,
          role: dialogs.role,
        },
      });
      const payload = result.data?.createAdminUser;
      dialogs.setCreateOpen(false);
      if (payload) {
        dialogs.setLinkResult({
          url: payload.activationUrl,
          expiresAt: payload.expiresAt,
          label: `Activation link for ${payload.user.email}`,
        });
      }
      // The link dialog should not wait for the list refresh.
      void list.refetch();
    } catch (error) {
      dialogs.setFormError(errorMessage(error, "Could not create user"));
    }
  }

  async function deleteSelectedUser() {
    if (!dialogs.deleteTarget) return;
    dialogs.setDeleteError(null);
    try {
      await deleteUser({ variables: { id: dialogs.deleteTarget.id } });
      const nextTotal = Math.max(0, list.total - 1);
      const nextPages = Math.max(1, Math.ceil(nextTotal / list.pageSize));
      dialogs.setDeleteTarget(null);
      if (list.page > nextPages) {
        list.setPage(nextPages);
        return;
      }
      await list.refetch();
    } catch (error) {
      dialogs.setDeleteError(errorMessage(error, "Could not remove user"));
    }
  }

  async function regenerateActivationLink() {
    if (!dialogs.activationTarget) return;
    const user = dialogs.activationTarget;
    dialogs.setFormError(null);
    try {
      const result = await generateActivation({
        variables: { userId: user.id },
      });
      const payload = result.data?.generateTenantUserActivationLink;
      if (!payload) throw new Error("Could not generate activation link");
      dialogs.setActivationTarget(null);
      dialogs.setActivationLinkUser(null);
      dialogs.setActivationLinkUnavailable(false);
      dialogs.setActivationLookupFailed(false);
      dialogs.setLinkResult({
        url: payload.activationUrl,
        expiresAt: payload.expiresAt,
        label: `Activation link for ${user.email}`,
      });
      // Show the newly issued link immediately; list freshness is non-blocking.
      void list.refetch();
    } catch (error) {
      dialogs.setFormError(errorMessage(error, "Could not reactivate user"));
    }
  }

  async function viewActivationLink(user: TenantUserLinkTarget) {
    dialogs.setFormError(null);
    dialogs.setActivationLinkUnavailable(false);
    dialogs.setActivationLookupFailed(false);
    try {
      const result = await loadActivationLink({
        variables: { userId: user.id },
      });
      const payload = result.data?.tenantUserActivationLink;
      if (payload) {
        dialogs.setActivationLinkUser(user);
        dialogs.setLinkResult({
          url: payload.activationUrl,
          expiresAt: payload.expiresAt,
          label: `Activation link for ${user.email}`,
        });
        return;
      }
      dialogs.setActivationLinkUnavailable(true);
      dialogs.setActivationTarget(user);
    } catch (error) {
      dialogs.setFormError(
        errorMessage(error, "Could not retrieve the activation link"),
      );
      dialogs.setActivationLookupFailed(true);
      dialogs.setActivationTarget(user);
    }
  }

  function requestActivationRegeneration() {
    if (!dialogs.activationLinkUser) return;
    dialogs.setLinkResult(null);
    dialogs.setActivationTarget(dialogs.activationLinkUser);
    dialogs.setActivationLinkUser(null);
    dialogs.setActivationLinkUnavailable(false);
    dialogs.setActivationLookupFailed(false);
    dialogs.setFormError(null);
  }

  function retryActivationLookup() {
    if (!dialogs.activationTarget) return;
    const user = dialogs.activationTarget;
    dialogs.setActivationTarget(null);
    void viewActivationLink(user);
  }

  async function showPasswordResetLink(user: { id: string; email: string }) {
    dialogs.setFormError(null);
    try {
      const result = await generateReset({ variables: { userId: user.id } });
      const payload = result.data?.generateTenantUserPasswordResetLink;
      if (!payload) throw new Error("Could not generate password reset link");
      dialogs.setLinkResult({
        url: payload.resetUrl,
        expiresAt: payload.expiresAt,
        label: `Password reset link for ${user.email}`,
      });
      return true;
    } catch (error) {
      dialogs.setFormError(
        errorMessage(error, "Could not generate password reset link"),
      );
      return false;
    }
  }

  return {
    creating,
    updating,
    deleting,
    regenerating,
    resetting,
    loadingActivationLink,
    loadingResetLink,
    saveUser,
    deleteSelectedUser,
    regenerateActivationLink,
    viewActivationLink,
    requestActivationRegeneration,
    retryActivationLookup,
    showPasswordResetLink,
    requestPasswordReset,
  };
}

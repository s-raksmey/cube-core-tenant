"use client";

import { EmptyState } from "@/components/dashboard/empty-state";
import {
  TenantUserDialogs,
  type TenantUserLinkTarget,
} from "@/components/users/tenant-user-dialogs";
import { TenantUserListToolbar } from "@/components/users/tenant-user-list-toolbar";
import {
  TenantUsersTable,
  type TenantUserRow,
} from "@/components/users/tenant-users-table";
import { useTenantUserDialogState } from "@/components/users/use-tenant-user-dialog-state";
import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";
import {
  CREATE_TENANT_USER,
  DELETE_TENANT_USER,
  GENERATE_TENANT_USER_ACTIVATION,
  GENERATE_TENANT_USER_PASSWORD_RESET,
  TENANT_USER_ACTIVATION_LINK,
  TENANT_USERS_QUERY,
  UPDATE_TENANT_USER,
} from "@/lib/apollo/operations";
import type { AuthUser, SubTenantRole } from "@/lib/types";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";

export function TenantUsersPanel({ viewer }: { viewer: AuthUser }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const {
    loading: loadingPermissions,
    error: permissionsError,
    canViewUsers,
    canCreateUsers,
    canEditUsers,
    canChangeRoles,
    canActivateUsers,
    canResetPasswords,
    canSuspendUsers,
    canDeleteUsers,
  } = useTenantUserPermissions();

  const { data, loading, error, refetch } = useQuery(TENANT_USERS_QUERY, {
    variables: { search: search || null, page, pageSize },
    skip: !canViewUsers,
  });

  const [createUser, { loading: creating }] = useMutation(CREATE_TENANT_USER);
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_TENANT_USER);
  const [generateActivation, { loading: regenerating }] = useMutation(
    GENERATE_TENANT_USER_ACTIVATION,
  );
  const [generateReset] = useMutation(GENERATE_TENANT_USER_PASSWORD_RESET);
  const [updateUser, { loading: updating }] = useMutation(UPDATE_TENANT_USER);
  const [loadActivationLink, { loading: loadingActivationLink }] = useLazyQuery(
    TENANT_USER_ACTIVATION_LINK,
    { fetchPolicy: "no-cache" },
  );
  const {
    createOpen,
    setCreateOpen,
    editTarget,
    setEditTarget,
    deleteTarget,
    setDeleteTarget,
    deleteError,
    setDeleteError,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    role,
    setRole,
    accountStatus,
    setAccountStatus,
    formError,
    setFormError,
    linkResult,
    setLinkResult,
    activationTarget,
    setActivationTarget,
    activationLinkUser,
    setActivationLinkUser,
    activationLinkUnavailable,
    setActivationLinkUnavailable,
    activationLookupFailed,
    setActivationLookupFailed,
    openCreate,
    openEdit,
  } = useTenantUserDialogState();

  const pageData = data?.tenantUsers;
  const users = pageData?.items ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const initialLoading = loading && !pageData;
  const blockingError = error && !pageData;
  const refreshError = error && !!pageData;

  const emptyDescription = useMemo(
    () =>
      search
        ? "No users match your search."
        : "Create the first Admin or Editor for this tenant.",
    [search],
  );

  async function handleCreate() {
    setFormError(null);
    try {
      if (editTarget) {
        await updateUser({
          variables: {
            id: editTarget.id,
            input: {
              firstName,
              lastName,
              email,
              ...(editTarget.id === viewer.id || !canChangeRoles
                ? {}
                : { role }),
              ...(editTarget.id === viewer.id ||
              !canSuspendUsers ||
              accountStatus ===
                (editTarget.membershipStatus === "DISABLED"
                  ? "INACTIVE"
                  : "ACTIVE")
                ? {}
                : { suspended: accountStatus === "INACTIVE" }),
            },
          },
        });
        setCreateOpen(false);
        setEditTarget(null);
        await refetch();
        return;
      }
      const result = await createUser({
        variables: { firstName, lastName, email, role },
      });
      const payload = result.data?.createAdminUser;
      setCreateOpen(false);
      if (payload) {
        setLinkResult({
          url: payload.activationUrl,
          expiresAt: payload.expiresAt,
          label: `Activation link for ${payload.user.email}`,
        });
      }
      await refetch();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not create user",
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteUser({ variables: { id: deleteTarget.id } });
      const nextTotal = Math.max(0, total - 1);
      const nextPages = Math.max(1, Math.ceil(nextTotal / pageSize));
      if (page > nextPages) setPage(nextPages);
      setDeleteTarget(null);
      await refetch({ page: Math.min(page, nextPages) });
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Could not remove user",
      );
    }
  }

  async function confirmActivationLink() {
    if (!activationTarget) return;
    const user = activationTarget;
    setFormError(null);
    try {
      const result = await generateActivation({
        variables: { userId: user.id },
      });
      const payload = result.data?.generateTenantUserActivationLink;
      if (!payload) throw new Error("Could not generate activation link");
      setActivationTarget(null);
      setActivationLinkUser(null);
      setActivationLinkUnavailable(false);
      setActivationLookupFailed(false);
      setLinkResult({
        url: payload.activationUrl,
        expiresAt: payload.expiresAt,
        label: `Activation link for ${user.email}`,
      });
      await refetch();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not reactivate user",
      );
    }
  }

  async function viewActivationLink(user: TenantUserLinkTarget) {
    setFormError(null);
    setActivationLinkUnavailable(false);
    setActivationLookupFailed(false);
    try {
      const result = await loadActivationLink({
        variables: { userId: user.id },
      });
      const payload = result.data?.tenantUserActivationLink;
      if (payload) {
        setActivationLinkUser(user);
        setLinkResult({
          url: payload.activationUrl,
          expiresAt: payload.expiresAt,
          label: `Activation link for ${user.email}`,
        });
        return;
      }
      setActivationLinkUnavailable(true);
      setActivationTarget(user);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not retrieve the activation link",
      );
      setActivationLookupFailed(true);
      setActivationTarget(user);
    }
  }

  function requestActivationRegeneration() {
    if (!activationLinkUser) return;
    setLinkResult(null);
    setActivationTarget(activationLinkUser);
    setActivationLinkUser(null);
    setActivationLinkUnavailable(false);
    setActivationLookupFailed(false);
    setFormError(null);
  }

  function retryActivationLookup() {
    if (!activationTarget) return;
    const user = activationTarget;
    setActivationTarget(null);
    void viewActivationLink(user);
  }

  async function showPasswordResetLink(user: { id: string; email: string }) {
    setFormError(null);
    try {
      const result = await generateReset({ variables: { userId: user.id } });
      const payload = result.data?.generateTenantUserPasswordResetLink;
      if (!payload) throw new Error("Could not generate password reset link");
      setLinkResult({
        url: payload.resetUrl,
        expiresAt: payload.expiresAt,
        label: `Password reset link for ${user.email}`,
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not generate password reset link",
      );
    }
  }

  return (
    <div className="space-y-4">
      <TenantUserListToolbar
        searchInput={searchInput}
        canCreateUsers={canCreateUsers}
        onSearchInputChange={setSearchInput}
        onSearch={() => {
          setPage(1);
          setSearch(searchInput.trim());
        }}
        onCreate={() => openCreate(canChangeRoles)}
      />

      {loadingPermissions ? (
        <p className="text-sm text-muted-foreground">Loading permissions…</p>
      ) : null}
      {permissionsError ? (
        <p className="text-sm text-destructive">
          Unable to load your user-management permissions.
        </p>
      ) : null}
      {!loadingPermissions && !permissionsError && !canViewUsers ? (
        <EmptyState
          title="User Management unavailable"
          description="Your role does not have permission to view users."
        />
      ) : null}
      {canViewUsers && initialLoading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : null}
      {canViewUsers && blockingError ? (
        <p className="text-sm text-destructive">Unable to load users.</p>
      ) : null}
      {canViewUsers && refreshError ? (
        <p className="text-sm text-destructive" role="status">
          Could not refresh users. Showing the most recent data.
        </p>
      ) : null}
      {canViewUsers &&
      !initialLoading &&
      !blockingError &&
      users.length === 0 ? (
        <EmptyState title="No users found" description={emptyDescription} />
      ) : null}

      {canViewUsers && users.length > 0 ? (
        <TenantUsersTable
          users={users as TenantUserRow[]}
          viewerId={viewer.id}
          actions={{
            canEditUsers,
            canChangeRoles,
            canActivateUsers,
            canSuspendUsers,
            canResetPasswords,
            canDeleteUsers,
          }}
          loadingActivationLink={loadingActivationLink}
          regenerating={regenerating}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          onEdit={(user) =>
            openEdit({
              id: user.id,
              firstName: user.firstName ?? null,
              lastName: user.lastName ?? null,
              email: user.email,
              role: user.role as SubTenantRole,
              status: user.status,
              membershipStatus: user.membershipStatus,
            })
          }
          onActivation={(user) => void viewActivationLink(user)}
          onResetPassword={(user) => void showPasswordResetLink(user)}
          onDelete={(user) => {
            setDeleteError(null);
            setDeleteTarget({
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
            });
          }}
        />
      ) : null}

      <TenantUserDialogs
        viewerId={viewer.id}
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        editTarget={editTarget}
        setEditTarget={setEditTarget}
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        activationTarget={activationTarget}
        setActivationTarget={setActivationTarget}
        activationLinkUser={activationLinkUser}
        setActivationLinkUser={setActivationLinkUser}
        linkResult={linkResult}
        setLinkResult={setLinkResult}
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        email={email}
        setEmail={setEmail}
        role={role}
        setRole={setRole}
        accountStatus={accountStatus}
        setAccountStatus={setAccountStatus}
        canEditUsers={canEditUsers}
        canChangeRoles={canChangeRoles}
        canSuspendUsers={canSuspendUsers}
        formError={formError}
        setFormError={setFormError}
        deleteError={deleteError}
        setDeleteError={setDeleteError}
        creating={creating}
        updating={updating}
        deleting={deleting}
        regenerating={regenerating}
        loadingActivationLink={loadingActivationLink}
        activationLinkUnavailable={activationLinkUnavailable}
        activationLookupFailed={activationLookupFailed}
        onSave={handleCreate}
        onDelete={handleDelete}
        onRegenerateActivation={confirmActivationLink}
        onRetryActivationLookup={retryActivationLookup}
        onRequestActivationRegeneration={requestActivationRegeneration}
      />
    </div>
  );
}

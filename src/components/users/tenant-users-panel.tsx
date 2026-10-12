"use client";

import { useMemo, useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { Plus, Search } from "lucide-react";
import {
  CREATE_TENANT_USER,
  DELETE_TENANT_USER,
  GENERATE_TENANT_USER_ACTIVATION,
  GENERATE_TENANT_USER_PASSWORD_RESET,
  TENANT_USER_ACTIVATION_LINK,
  TENANT_USER_PERMISSIONS_QUERY,
  UPDATE_TENANT_USER,
  TENANT_USERS_QUERY,
} from "@/lib/apollo/operations";
import type { AuthUser, SubTenantRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/dashboard/empty-state";
import { TenantUsersTable, type TenantUserRow } from "@/components/users/tenant-users-table";
import {
  TenantUserDialogs,
  type TenantUserDeleteTarget,
  type TenantUserEditTarget,
  type TenantUserLinkTarget,
} from "@/components/users/tenant-user-dialogs";

export function TenantUsersPanel({ viewer }: { viewer: AuthUser }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: permissionsData, loading: loadingPermissions, error: permissionsError } = useQuery(
    TENANT_USER_PERMISSIONS_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const tenantPermissions = new Set(permissionsData?.tenantUserPermissions ?? []);
  const canViewUsers = tenantPermissions.has("USERS_VIEW");
  const canCreateUsers = tenantPermissions.has("USERS_CREATE");
  const canEditUsers = tenantPermissions.has("USERS_EDIT");
  const canChangeRoles = tenantPermissions.has("USERS_CHANGE_ROLE");
  const canActivateUsers = tenantPermissions.has("USERS_ACTIVATE");
  const canResetPasswords = tenantPermissions.has("USERS_RESET_PASSWORD");
  const canSuspendUsers = tenantPermissions.has("USERS_SUSPEND");
  const canDeleteUsers = tenantPermissions.has("USERS_DELETE");

  const { data, loading, error, refetch } = useQuery(TENANT_USERS_QUERY, {
    variables: { search: search || null, page, pageSize },
    fetchPolicy: "cache-first",
    skip: !canViewUsers,
  });

  const [createUser, { loading: creating }] = useMutation(CREATE_TENANT_USER);
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_TENANT_USER);
  const [generateActivation, { loading: regenerating }] = useMutation(GENERATE_TENANT_USER_ACTIVATION);
  const [generateReset] = useMutation(GENERATE_TENANT_USER_PASSWORD_RESET);
  const [updateUser, { loading: updating }] = useMutation(UPDATE_TENANT_USER);
  const [loadActivationLink, { loading: loadingActivationLink }] = useLazyQuery(
    TENANT_USER_ACTIVATION_LINK,
    { fetchPolicy: "no-cache" },
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TenantUserEditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantUserDeleteTarget | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SubTenantRole>("EDITOR");
  const [accountStatus, setAccountStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [formError, setFormError] = useState<string | null>(null);
  const [linkResult, setLinkResult] = useState<{
    url: string;
    expiresAt: string;
    label: string;
  } | null>(null);
  const [activationTarget, setActivationTarget] = useState<TenantUserLinkTarget | null>(null);
  const [activationLinkUser, setActivationLinkUser] = useState<TenantUserLinkTarget | null>(null);
  const [activationLinkUnavailable, setActivationLinkUnavailable] = useState(false);
  const [activationLookupFailed, setActivationLookupFailed] = useState(false);

  const pageData = data?.tenantUsers;
  const users = pageData?.items ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
              ...(editTarget.id === viewer.id || !canChangeRoles ? {} : { role }),
              ...(editTarget.id === viewer.id || !canSuspendUsers ||
                accountStatus === (editTarget.membershipStatus === "DISABLED" ? "INACTIVE" : "ACTIVE")
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
      setFormError(err instanceof Error ? err.message : "Could not create user");
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
      const result = await generateActivation({ variables: { userId: user.id } });
      const payload = result.data?.generateTenantUserActivationLink;
      if (!payload) throw new Error("Could not generate activation link");
      setActivationTarget(null);
      setActivationLinkUser(null);
      setActivationLinkUnavailable(false);
      setActivationLookupFailed(false);
      setLinkResult({ url: payload.activationUrl, expiresAt: payload.expiresAt, label: `Activation link for ${user.email}` });
      await refetch();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not reactivate user");
    }
  }

  async function viewActivationLink(user: TenantUserLinkTarget) {
    setFormError(null);
    setActivationLinkUnavailable(false);
    setActivationLookupFailed(false);
    try {
      const result = await loadActivationLink({ variables: { userId: user.id } });
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
      setFormError(error instanceof Error ? error.message : "Could not retrieve the activation link");
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
      setLinkResult({ url: payload.resetUrl, expiresAt: payload.expiresAt, label: `Password reset link for ${user.email}` });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not generate password reset link");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-md gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setSearch(searchInput.trim());
                }
              }}
              placeholder="Search by name, username, or email"
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            Search
          </Button>
        </div>
        {canCreateUsers ? (
          <Button
            type="button"
            onClick={() => {
              setFirstName("");
              setLastName("");
              setEmail("");
              setRole(canChangeRoles ? "ADMIN" : "EDITOR");
              setAccountStatus("ACTIVE");
              setFormError(null);
              setEditTarget(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="size-4" />
            Create User
          </Button>
        ) : null}
      </div>

      {loadingPermissions ? (
        <p className="text-sm text-muted-foreground">Loading permissions…</p>
      ) : null}
      {permissionsError ? (
        <p className="text-sm text-destructive">Unable to load your user-management permissions.</p>
      ) : null}
      {!loadingPermissions && !permissionsError && !canViewUsers ? (
        <EmptyState title="User Management unavailable" description="Your role does not have permission to view users." />
      ) : null}
      {canViewUsers && loading && !pageData ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : null}
      {canViewUsers && error ? (
        <p className="text-sm text-destructive">Unable to load users.</p>
      ) : null}
      {canViewUsers && !loading && !error && users.length === 0 ? (
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
          onEdit={(user) => {
            setEditTarget({
              id: user.id,
              firstName: user.firstName ?? null,
              lastName: user.lastName ?? null,
              email: user.email,
              role: user.role as SubTenantRole,
              status: user.status,
              membershipStatus: user.membershipStatus,
            });
            setFirstName(user.firstName ?? "");
            setLastName(user.lastName ?? "");
            setEmail(user.email);
            setRole(user.role as SubTenantRole);
            setAccountStatus(user.membershipStatus === "DISABLED" ? "INACTIVE" : "ACTIVE");
            setFormError(null);
            setCreateOpen(true);
          }}
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

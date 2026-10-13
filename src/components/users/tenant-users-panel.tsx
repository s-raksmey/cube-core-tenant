"use client";

import { EmptyState } from "@/components/dashboard/empty-state";
import { useConsoleUser } from "@/components/providers/console-user-provider";
import { useTenantUserActions } from "@/hooks/use-tenant-user-actions";
import { useTenantUserDialogState } from "@/hooks/use-tenant-user-dialog-state";
import { useTenantUsers } from "@/hooks/use-tenant-users";
import { TenantUserDialogs } from "@/components/users/tenant-user-dialogs";
import { TenantUserListToolbar } from "@/components/users/tenant-user-list-toolbar";
import { TenantUsersTable } from "@/components/users/tenant-users-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";
import type { SubTenantRole } from "@/lib/types";
import { useState } from "react";

/** Coordinates tenant user-management UI, data, dialog state, and actions. */
export function TenantUsersPanel() {
  const [resetTarget, setResetTarget] = useState<{ id: string; email: string; fullName: string | null } | null>(null);
  const viewer = useConsoleUser();
  const permissions = useTenantUserPermissions();
  const list = useTenantUsers({ canViewUsers: permissions.canViewUsers });
  const dialogs = useTenantUserDialogState();
  const actions = useTenantUserActions({
    viewerId: viewer.id,
    canChangeRoles: permissions.canChangeRoles,
    canSuspendUsers: permissions.canSuspendUsers,
    dialogs,
    list,
    onResetConfirmation: setResetTarget,
  });

  if (!permissions.loading && !permissions.canViewUsers) {
    return (
      <EmptyState
        title="User Management unavailable"
        description="Your role does not have permission to view users."
      />
    );
  }

  const initialLoading = permissions.loading || list.initialLoading;

  return (
    <div className="space-y-4">
      <TenantUserListToolbar
        searchInput={list.searchInput}
        canCreateUsers={permissions.canCreateUsers}
        onSearchInputChange={list.setSearchInput}
        onSearch={list.applySearch}
        onCreate={() => dialogs.openCreate(permissions.canChangeRoles)}
      />

      {initialLoading ? (
        <div className="flex min-h-32 items-center justify-center" aria-busy="true">
          <p className="text-sm text-muted-foreground">Loading users…</p>
        </div>
      ) : null}

      {list.blockingError ? (
        <EmptyState
          title="Unable to load users"
          description="The user list could not be loaded. Please try again."
        />
      ) : null}

      {list.refreshError ? (
        <p className="text-sm text-destructive" role="status">
          Could not refresh users. Showing the most recent data.
        </p>
      ) : null}

      {!initialLoading && !list.blockingError && list.users.length === 0 ? (
        <EmptyState title="No users found" description={list.emptyDescription} />
      ) : null}

      {list.users.length > 0 ? (
        <TenantUsersTable
          users={list.users}
          viewerId={viewer.id}
          actions={{
            canEditUsers: permissions.canEditUsers,
            canChangeRoles: permissions.canChangeRoles,
            canActivateUsers: permissions.canActivateUsers,
            canSuspendUsers: permissions.canSuspendUsers,
            canResetPasswords: permissions.canResetPasswords,
            canDeleteUsers: permissions.canDeleteUsers,
          }}
          loadingActivationLink={actions.loadingActivationLink}
          regenerating={actions.regenerating}
          page={list.page}
          totalPages={list.totalPages}
          total={list.total}
          onPageChange={(nextPage) => {
            if (nextPage !== list.page) list.setPage(nextPage);
          }}
          onEdit={(user) =>
            dialogs.openEdit({
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role as SubTenantRole,
              status: user.status,
              membershipStatus: user.membershipStatus,
            })
          }
          onActivation={(user) => {
            dialogs.setFormError(null);
            dialogs.setActivationLinkUnavailable(false);
            dialogs.setActivationLookupFailed(false);
            if (user.status === "ACTIVE") {
              dialogs.setActivationTarget(user);
              return;
            }
            void actions.viewActivationLink(user);
          }}
          loadingPasswordReset={actions.loadingResetLink || actions.resetting}
          onResetPassword={actions.requestPasswordReset}
          onDelete={(user) => {
            dialogs.setDeleteError(null);
            dialogs.setDeleteTarget({
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
        createOpen={dialogs.createOpen}
        setCreateOpen={dialogs.setCreateOpen}
        editTarget={dialogs.editTarget}
        setEditTarget={dialogs.setEditTarget}
        deleteTarget={dialogs.deleteTarget}
        setDeleteTarget={dialogs.setDeleteTarget}
        activationTarget={dialogs.activationTarget}
        setActivationTarget={dialogs.setActivationTarget}
        activationLinkUser={dialogs.activationLinkUser}
        setActivationLinkUser={dialogs.setActivationLinkUser}
        linkResult={dialogs.linkResult}
        setLinkResult={dialogs.setLinkResult}
        firstName={dialogs.firstName}
        setFirstName={dialogs.setFirstName}
        lastName={dialogs.lastName}
        setLastName={dialogs.setLastName}
        email={dialogs.email}
        setEmail={dialogs.setEmail}
        role={dialogs.role}
        setRole={dialogs.setRole}
        accountStatus={dialogs.accountStatus}
        setAccountStatus={dialogs.setAccountStatus}
        canEditUsers={permissions.canEditUsers}
        canChangeRoles={permissions.canChangeRoles}
        canSuspendUsers={permissions.canSuspendUsers}
        formError={dialogs.formError}
        setFormError={dialogs.setFormError}
        deleteError={dialogs.deleteError}
        setDeleteError={dialogs.setDeleteError}
        creating={actions.creating}
        updating={actions.updating}
        deleting={actions.deleting}
        regenerating={actions.regenerating}
        loadingActivationLink={actions.loadingActivationLink}
        activationLinkUnavailable={dialogs.activationLinkUnavailable}
        activationLookupFailed={dialogs.activationLookupFailed}
        onSave={actions.saveUser}
        onDelete={actions.deleteSelectedUser}
        onRegenerateActivation={actions.regenerateActivationLink}
        onRetryActivationLookup={actions.retryActivationLookup}
        onRequestActivationRegeneration={actions.requestActivationRegeneration}
      />
      <Dialog open={Boolean(resetTarget)} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password?</DialogTitle>
            <DialogDescription>
              View the current single-use reset link for {resetTarget?.fullName ?? resetTarget?.email}. A valid unused stored link is reused; an expired or used link is replaced and stored for two hours.
            </DialogDescription>
          </DialogHeader>
          {dialogs.formError ? <p className="text-sm text-destructive" role="alert">{dialogs.formError}</p> : null}
          <DialogFooter>
            <Button variant="outline" disabled={actions.resetting || actions.loadingResetLink} onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button disabled={actions.resetting || actions.loadingResetLink} onClick={() => {
              if (!resetTarget) return;
              void actions.showPasswordResetLink(resetTarget).then((created) => {
                if (created) setResetTarget(null);
              });
            }}>
              {actions.resetting || actions.loadingResetLink ? "Loading link…" : "Yes, reset password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

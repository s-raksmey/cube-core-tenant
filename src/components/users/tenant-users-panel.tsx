"use client";

import { useMemo, useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { Copy, KeyRound, Link2, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/empty-state";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

type TenantUserLinkTarget = {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
};

export function TenantUsersPanel({ viewer }: { viewer: AuthUser }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: permissionsData, loading: loadingPermissions, error: permissionsError } = useQuery(
    TENANT_USER_PERMISSIONS_QUERY,
    { fetchPolicy: "cache-first" },
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
  const hasAnyUserAction = canEditUsers || canChangeRoles || canActivateUsers || canSuspendUsers || canResetPasswords || canDeleteUsers;

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
  const [editTarget, setEditTarget] = useState<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: SubTenantRole;
    status: string | null;
    membershipStatus: string | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    username: string | null;
    email: string;
    role: string;
  } | null>(null);
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
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>2FA</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last login</TableHead>
                {hasAnyUserAction ? (
                  <TableHead className="text-right">Actions</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.fullName ||
                      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.username ?? "—"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === "ACTIVE"
                          ? "default"
                          : user.status === "PENDING"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {user.membershipStatus === "DISABLED" ? "SUSPENDED" : user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.totpEnabled ? "On" : "Off"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.lastLoginAt)}
                  </TableCell>
                  {hasAnyUserAction ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canEditUsers || canChangeRoles || canSuspendUsers ? <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${user.username || user.email}`}
                          title="Edit user"
                          onClick={() => {
                            setEditTarget({
                              id: user.id,
                              firstName: user.firstName,
                              lastName: user.lastName,
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
                        >
                          <Pencil className="size-4" />
                        </Button> : null}
                        {user.id !== viewer.id ? (
                          <>
                        {canActivateUsers && (user.status === "PENDING" || user.status === "ACTIVE") ? (
                        <Button type="button" variant="ghost" size="icon" aria-label={`${user.status === "ACTIVE" ? "Reactivate" : "View activation link for"} ${user.username || user.email}`} title={user.status === "ACTIVE" ? "Reactivate account and reset 2FA" : "View activation link"} disabled={loadingActivationLink || regenerating} onClick={() => void viewActivationLink(user)}>
                          {user.status === "ACTIVE" ? <RotateCcw className="size-4" /> : <Link2 className="size-4" />}
                        </Button>
                        ) : null}
                        {canResetPasswords ? <Button type="button" variant="ghost" size="icon" aria-label={`Reset password for ${user.username || user.email}`} title="Reset password" disabled={user.status !== "ACTIVE" && user.status !== "LOCKED"} onClick={() => void showPasswordResetLink(user)}>
                          <KeyRound className="size-4" />
                        </Button> : null}
                        {canDeleteUsers ? <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${user.username || user.email}`} title="Delete tenant user" onClick={() => { setDeleteError(null); setDeleteTarget({ id: user.id, username: user.username, email: user.email, role: user.role }); }}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button> : null}
                          </>
                      ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>
              Page {page} of {totalPages} · {total} user
              {total === 1 ? "" : "s"}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setEditTarget(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit User" : "Create User"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? editTarget.id === viewer.id
                  ? "Update your profile. Your role and account status cannot be changed here."
                  : "Update this tenant user's profile."
                : "Creates a PENDING tenant account. They activate with username, password, 2FA, and recovery codes."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tu-first">First name</Label>
                <Input
                  id="tu-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={Boolean(editTarget) && !canEditUsers}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tu-last">Last name</Label>
                <Input
                  id="tu-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={Boolean(editTarget) && !canEditUsers}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tu-email">Email</Label>
              <Input
                id="tu-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={Boolean(editTarget) && !canEditUsers}
              />
            </div>
            {canChangeRoles && editTarget?.id !== viewer.id ? (
              <div className="space-y-1.5">
                <Label htmlFor="tu-role">Role</Label>
                <select
                  id="tu-role"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as SubTenantRole)}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="EDITOR">EDITOR</option>
                </select>
              </div>
            ) : !editTarget && canChangeRoles ? (
              <div className="space-y-1.5">
                <Label htmlFor="tu-role">Role</Label>
                <select
                  id="tu-role"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as SubTenantRole)}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="EDITOR">EDITOR</option>
                </select>
              </div>
            ) : null}
            {editTarget?.id === viewer.id || !canSuspendUsers ||
            editTarget?.status === "PENDING" ? null : (
              <div className="space-y-1.5">
                <Label htmlFor="tu-status">Tenant access</Label>
                <select
                  id="tu-status"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={accountStatus}
                  onChange={(e) => setAccountStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                >
                  <option value="ACTIVE">Unsuspend</option>
                  <option value="INACTIVE">Suspend</option>
                </select>
              </div>
            )}
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={
                creating ||
                updating ||
                !firstName.trim() ||
                !lastName.trim() ||
                !email.trim()
              }
            >
              {creating || updating ? "Saving…" : editTarget ? "Save changes" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={activationTarget !== null}
        onOpenChange={(open) => {
          if (!open && !regenerating) {
            setActivationTarget(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activationLookupFailed
                ? "Could not retrieve the activation link"
                : activationLinkUnavailable
                  ? "No existing link is available"
                  : "Regenerate activation link?"}
            </DialogTitle>
            <DialogDescription>
              {activationLookupFailed
                ? "The existing link was not changed. Retry to view it, or regenerate a replacement link."
                : activationLinkUnavailable
                  ? "The existing link has expired, was used, or cannot be recovered. Generate a new single-use activation link for this pending user."
                  : "The existing activation link will be revoked. Only the new single-use link will work."}
            </DialogDescription>
          </DialogHeader>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={regenerating}
              onClick={() => {
                setActivationTarget(null);
                setFormError(null);
              }}
            >
              Cancel
            </Button>
            {activationLookupFailed ? (
              <Button type="button" variant="outline" disabled={loadingActivationLink || regenerating} onClick={retryActivationLookup}>
                Retry
              </Button>
            ) : null}
            <Button type="button" disabled={regenerating} onClick={() => void confirmActivationLink()}>
              {regenerating ? "Regenerating…" : "Regenerate link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={linkResult !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLinkResult(null);
            setActivationLinkUser(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{linkResult?.label ?? "Secure link"}</DialogTitle>
            <DialogDescription>
              Expires {linkResult?.expiresAt ? new Date(linkResult.expiresAt).toLocaleString() : "—"}. Copy and deliver through an approved channel. The link is single-use.
            </DialogDescription>
          </DialogHeader>
          <p className="break-all rounded-md bg-muted p-3 text-sm">{linkResult?.url}</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLinkResult(null)}>
              Close
            </Button>
            <Button type="button" onClick={() => linkResult ? void navigator.clipboard.writeText(linkResult.url) : undefined}>
              <Copy className="size-4" />
              Copy link
            </Button>
            {activationLinkUser ? (
              <Button type="button" variant="outline" onClick={requestActivationRegeneration}>
                Regenerate link
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tenant user?</DialogTitle>
            <DialogDescription>
              Suspend this user first. Once suspended, deleting permanently
              removes their access to the current tenant and revokes their tenant
              sessions. Their account is preserved if they still have access to
              another tenant.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget ? (
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">
                {deleteTarget.username || deleteTarget.email}
              </p>
              <p className="text-muted-foreground">
                {deleteTarget.email} · {deleteTarget.role}
              </p>
            </div>
          ) : null}
          {deleteError ? (
            <p className="text-sm text-destructive">{deleteError}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting…" : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

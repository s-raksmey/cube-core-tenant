"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Copy, Plus, Search, Trash2 } from "lucide-react";
import {
  CREATE_TENANT_USER,
  DELETE_TENANT_USER,
  TENANT_USERS_QUERY,
} from "@/lib/apollo/operations";
import type { AuthUser, SubTenantRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  return new Date(value).toLocaleString();
}

export function TenantUsersPanel({ viewer }: { viewer: AuthUser }) {
  const canManage = viewer.role === "ADMIN";
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, loading, error, refetch } = useQuery(TENANT_USERS_QUERY, {
    variables: { search: search || null, page, pageSize },
    fetchPolicy: "cache-and-network",
  });

  const [createUser, { loading: creating }] = useMutation(CREATE_TENANT_USER);
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_TENANT_USER);
  const [createOpen, setCreateOpen] = useState(false);
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
  const [formError, setFormError] = useState<string | null>(null);
  const [linkResult, setLinkResult] = useState<{
    url: string;
    expiresAt: string;
    label: string;
  } | null>(null);

  const pageData = data?.tenantUsers;
  const users = pageData?.items ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const emptyDescription = useMemo(
    () =>
      search
        ? "No users match your search."
        : "Invite the first Admin or Editor for this tenant.",
    [search],
  );

  async function handleCreate() {
    setFormError(null);
    try {
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
        {canManage ? (
          <Button
            type="button"
            onClick={() => {
              setFirstName("");
              setLastName("");
              setEmail("");
              setRole("EDITOR");
              setFormError(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="size-4" />
            Invite user
          </Button>
        ) : null}
      </div>

      {linkResult ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{linkResult.label}</CardTitle>
            <CardDescription>
              Expires {formatDate(linkResult.expiresAt)}. The invitee sets a
              username, password, 2FA, and recovery codes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="break-all rounded-md bg-muted p-3 text-sm">
              {linkResult.url}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  void navigator.clipboard.writeText(linkResult.url)
                }
              >
                <Copy className="size-4" />
                Copy link
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLinkResult(null)}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {loading && !pageData ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive">Unable to load users.</p>
      ) : null}
      {!loading && !error && users.length === 0 ? (
        <EmptyState title="No users found" description={emptyDescription} />
      ) : null}

      {users.length > 0 ? (
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
                {canManage ? (
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
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.totpEnabled ? "On" : "Off"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  {canManage ? (
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${user.username || user.email}`}
                        title="Remove tenant access"
                        disabled={user.id === viewer.id}
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget({
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            role: user.role,
                          });
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
            <DialogDescription>
              Creates a PENDING membership. They activate with username,
              password, 2FA, and recovery codes.
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
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tu-last">Last name</Label>
                <Input
                  id="tu-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
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
              />
            </div>
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
                !firstName.trim() ||
                !lastName.trim() ||
                !email.trim()
              }
            >
              {creating ? "Creating…" : "Create invite"}
            </Button>
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
            <DialogTitle>Remove tenant user?</DialogTitle>
            <DialogDescription>
              This removes this user’s access to the current tenant and revokes
              their tenant sessions. Their account is preserved if they still
              have access to another tenant.
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
              {deleting ? "Removing…" : "Remove user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

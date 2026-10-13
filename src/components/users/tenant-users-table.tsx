"use client";

import { KeyRound, Link2, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  TenantUserActions,
  TenantUserRow,
} from "@/types/tenant-user.types";
export type { TenantUserActions, TenantUserRow } from "@/types/tenant-user.types";

type TenantUsersTableProps = {
  users: TenantUserRow[];
  viewerId: string;
  actions: TenantUserActions;
  loadingActivationLink: boolean;
  loadingPasswordReset: boolean;
  regenerating: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onEdit: (user: TenantUserRow) => void;
  onActivation: (user: TenantUserRow) => void;
  onResetPassword: (user: TenantUserRow) => void;
  onDelete: (user: TenantUserRow) => void;
};

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function statusVariant(user: TenantUserRow) {
  if (user.membershipStatus === "DISABLED") return "destructive" as const;
  if (user.status === "ACTIVE") return "default" as const;
  if (user.status === "PENDING") return "secondary" as const;
  return "destructive" as const;
}

export function TenantUsersTable({
  users,
  viewerId,
  actions,
  loadingActivationLink,
  loadingPasswordReset,
  regenerating,
  page,
  totalPages,
  total,
  onPageChange,
  onEdit,
  onActivation,
  onResetPassword,
  onDelete,
}: TenantUsersTableProps) {
  const hasAnyAction = Object.values(actions).some(Boolean);
  const canOpenEdit =
    actions.canEditUsers || actions.canChangeRoles || actions.canSuspendUsers;

  return (
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
            {hasAnyAction ? (
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
                <Badge variant={statusVariant(user)}>
                  {user.membershipStatus === "DISABLED"
                    ? "SUSPENDED"
                    : user.status}
                </Badge>
              </TableCell>
              <TableCell>{user.totpEnabled ? "On" : "Off"}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(user.lastLoginAt)}
              </TableCell>
              {hasAnyAction ? (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {canOpenEdit ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${user.username || user.email}`}
                        title="Edit user"
                        onClick={() => onEdit(user)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    ) : null}
                    {user.id !== viewerId ? (
                      <>
                        {actions.canActivateUsers &&
                        (user.status === "PENDING" ||
                          user.status === "ACTIVE") ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`${user.status === "ACTIVE" ? "Reactivate" : "View activation link for"} ${user.username || user.email}`}
                            title={
                              user.status === "ACTIVE"
                                ? "Reactivate account and reset 2FA"
                                : "View activation link"
                            }
                            disabled={loadingActivationLink || regenerating}
                            onClick={() => onActivation(user)}
                          >
                            {user.status === "ACTIVE" ? (
                              <RotateCcw className="size-4" />
                            ) : (
                              <Link2 className="size-4" />
                            )}
                          </Button>
                        ) : null}
                        {actions.canResetPasswords ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Reset password for ${user.username || user.email}`}
                            title="Reset password"
                            disabled={
                              loadingPasswordReset ||
                              user.status !== "ACTIVE" &&
                              user.status !== "LOCKED"
                            }
                            onClick={() => onResetPassword(user)}
                          >
                            <KeyRound className="size-4" />
                          </Button>
                        ) : null}
                        {actions.canDeleteUsers ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${user.username || user.email}`}
                            title="Delete tenant user"
                            onClick={() => onDelete(user)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        ) : null}
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
          Page {page} of {totalPages} · {total} user{total === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

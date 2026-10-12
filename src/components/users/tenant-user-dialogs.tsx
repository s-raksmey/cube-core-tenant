"use client";

import type { Dispatch, SetStateAction } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SubTenantRole } from "@/lib/types";

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
};

type LinkResult = { url: string; expiresAt: string; label: string };

type TenantUserDialogsProps = {
  viewerId: string;
  createOpen: boolean;
  setCreateOpen: Dispatch<SetStateAction<boolean>>;
  editTarget: TenantUserEditTarget | null;
  setEditTarget: Dispatch<SetStateAction<TenantUserEditTarget | null>>;
  deleteTarget: TenantUserDeleteTarget | null;
  setDeleteTarget: Dispatch<SetStateAction<TenantUserDeleteTarget | null>>;
  activationTarget: TenantUserLinkTarget | null;
  setActivationTarget: Dispatch<SetStateAction<TenantUserLinkTarget | null>>;
  activationLinkUser: TenantUserLinkTarget | null;
  setActivationLinkUser: Dispatch<SetStateAction<TenantUserLinkTarget | null>>;
  linkResult: LinkResult | null;
  setLinkResult: Dispatch<SetStateAction<LinkResult | null>>;
  firstName: string;
  setFirstName: Dispatch<SetStateAction<string>>;
  lastName: string;
  setLastName: Dispatch<SetStateAction<string>>;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  role: SubTenantRole;
  setRole: Dispatch<SetStateAction<SubTenantRole>>;
  accountStatus: "ACTIVE" | "INACTIVE";
  setAccountStatus: Dispatch<SetStateAction<"ACTIVE" | "INACTIVE">>;
  canEditUsers: boolean;
  canChangeRoles: boolean;
  canSuspendUsers: boolean;
  formError: string | null;
  setFormError: Dispatch<SetStateAction<string | null>>;
  deleteError: string | null;
  setDeleteError: Dispatch<SetStateAction<string | null>>;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  regenerating: boolean;
  loadingActivationLink: boolean;
  activationLinkUnavailable: boolean;
  activationLookupFailed: boolean;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onRegenerateActivation: () => Promise<void>;
  onRetryActivationLookup: () => void;
  onRequestActivationRegeneration: () => void;
};

export function TenantUserDialogs(props: TenantUserDialogsProps) {
  const {
    viewerId, createOpen, setCreateOpen, editTarget, setEditTarget,
    deleteTarget, setDeleteTarget, activationTarget, setActivationTarget,
    activationLinkUser, setActivationLinkUser, linkResult, setLinkResult,
    firstName, setFirstName, lastName, setLastName, email, setEmail, role,
    setRole, accountStatus, setAccountStatus, canEditUsers, canChangeRoles,
    canSuspendUsers, formError, setFormError, deleteError, setDeleteError,
    creating, updating, deleting, regenerating, loadingActivationLink,
    activationLinkUnavailable, activationLookupFailed, onSave, onDelete,
    onRegenerateActivation, onRetryActivationLookup,
    onRequestActivationRegeneration,
  } = props;

  return (
    <>
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setEditTarget(null); setFormError(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit User" : "Create User"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? editTarget.id === viewerId
                  ? "Update your profile. Your role and account status cannot be changed here."
                  : "Update this tenant user's profile."
                : "Creates a PENDING tenant account. They activate with username, password, 2FA, and recovery codes."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="tu-first">First name</Label><Input id="tu-first" value={firstName} onChange={(event) => setFirstName(event.target.value)} disabled={Boolean(editTarget) && !canEditUsers} autoFocus /></div>
              <div className="space-y-1.5"><Label htmlFor="tu-last">Last name</Label><Input id="tu-last" value={lastName} onChange={(event) => setLastName(event.target.value)} disabled={Boolean(editTarget) && !canEditUsers} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="tu-email">Email</Label><Input id="tu-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={Boolean(editTarget) && !canEditUsers} /></div>
            {canChangeRoles && editTarget?.id !== viewerId ? <RoleSelect value={role} onChange={setRole} /> : !editTarget && canChangeRoles ? <RoleSelect value={role} onChange={setRole} /> : null}
            {editTarget?.id === viewerId || !canSuspendUsers || editTarget?.status === "PENDING" ? null : (
              <div className="space-y-1.5"><Label htmlFor="tu-status">Tenant access</Label><select id="tu-status" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={accountStatus} onChange={(event) => setAccountStatus(event.target.value as "ACTIVE" | "INACTIVE")}><option value="ACTIVE">Unsuspend</option><option value="INACTIVE">Suspend</option></select></div>
            )}
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="button" onClick={() => void onSave()} disabled={creating || updating || !firstName.trim() || !lastName.trim() || !email.trim()}>{creating || updating ? "Saving…" : editTarget ? "Save changes" : "Create User"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activationTarget !== null} onOpenChange={(open) => { if (!open && !regenerating) { setActivationTarget(null); setFormError(null); } }}>
        <DialogContent><DialogHeader><DialogTitle>{activationLookupFailed ? "Could not retrieve the activation link" : activationLinkUnavailable ? "No existing link is available" : "Regenerate activation link?"}</DialogTitle><DialogDescription>{activationLookupFailed ? "The existing link was not changed. Retry to view it, or regenerate a replacement link." : activationLinkUnavailable ? "The existing link has expired, was used, or cannot be recovered. Generate a new single-use activation link for this pending user." : "The existing activation link will be revoked. Only the new single-use link will work."}</DialogDescription></DialogHeader>{formError ? <p className="text-sm text-destructive">{formError}</p> : null}<DialogFooter><Button type="button" variant="outline" disabled={regenerating} onClick={() => { setActivationTarget(null); setFormError(null); }}>Cancel</Button>{activationLookupFailed ? <Button type="button" variant="outline" disabled={loadingActivationLink || regenerating} onClick={onRetryActivationLookup}>Retry</Button> : null}<Button type="button" disabled={regenerating} onClick={() => void onRegenerateActivation()}>{regenerating ? "Regenerating…" : "Regenerate link"}</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={linkResult !== null} onOpenChange={(open) => { if (!open) { setLinkResult(null); setActivationLinkUser(null); } }}>
        <DialogContent><DialogHeader><DialogTitle>{linkResult?.label ?? "Secure link"}</DialogTitle><DialogDescription>Expires {linkResult?.expiresAt ? new Date(linkResult.expiresAt).toLocaleString() : "—"}. Copy and deliver through an approved channel. The link is single-use.</DialogDescription></DialogHeader><p className="break-all rounded-md bg-muted p-3 text-sm">{linkResult?.url}</p><DialogFooter><Button type="button" variant="outline" onClick={() => setLinkResult(null)}>Close</Button><Button type="button" onClick={() => linkResult ? void navigator.clipboard.writeText(linkResult.url) : undefined}><Copy className="size-4" />Copy link</Button>{activationLinkUser ? <Button type="button" variant="outline" onClick={onRequestActivationRegeneration}>Regenerate link</Button> : null}</DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open && !deleting) { setDeleteTarget(null); setDeleteError(null); } }}>
        <DialogContent><DialogHeader><DialogTitle>Delete tenant user?</DialogTitle><DialogDescription>Suspend this user first. Once suspended, deleting permanently removes their account, credentials, and sessions from the database.</DialogDescription></DialogHeader>{deleteTarget ? <div className="rounded-md border p-3 text-sm"><p className="font-medium">{deleteTarget.username || deleteTarget.email}</p><p className="text-muted-foreground">{deleteTarget.email} · {deleteTarget.role}</p></div> : null}{deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}<DialogFooter><Button type="button" variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</Button><Button type="button" variant="destructive" disabled={deleting} onClick={() => void onDelete()}>{deleting ? "Deleting…" : "Delete user"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </>
  );
}

function RoleSelect({ value, onChange }: { value: SubTenantRole; onChange: Dispatch<SetStateAction<SubTenantRole>> }) {
  return <div className="space-y-1.5"><Label htmlFor="tu-role">Role</Label><select id="tu-role" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={value} onChange={(event) => onChange(event.target.value as SubTenantRole)}><option value="ADMIN">ADMIN</option><option value="EDITOR">EDITOR</option></select></div>;
}

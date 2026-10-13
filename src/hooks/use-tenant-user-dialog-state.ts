"use client";

import type {
  TenantUserDeleteTarget,
  TenantUserEditTarget,
  TenantUserLinkTarget,
  TenantUserLinkResult,
} from "@/types/tenant-user.types";
import type { SubTenantRole } from "@/lib/types";
import { useState } from "react";

/** Groups form and dialog state for tenant user-management actions. */
export function useTenantUserDialogState() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TenantUserEditTarget | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] =
    useState<TenantUserDeleteTarget | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SubTenantRole>("EDITOR");
  const [accountStatus, setAccountStatus] = useState<"ACTIVE" | "INACTIVE">(
    "ACTIVE",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [linkResult, setLinkResult] = useState<TenantUserLinkResult | null>(
    null,
  );
  const [activationTarget, setActivationTarget] =
    useState<TenantUserLinkTarget | null>(null);
  const [activationLinkUser, setActivationLinkUser] =
    useState<TenantUserLinkTarget | null>(null);
  const [activationLinkUnavailable, setActivationLinkUnavailable] =
    useState(false);
  const [activationLookupFailed, setActivationLookupFailed] = useState(false);
  function openCreate(canChangeRoles: boolean) {
    setFirstName("");
    setLastName("");
    setEmail("");
    setRole(canChangeRoles ? "ADMIN" : "EDITOR");
    setAccountStatus("ACTIVE");
    setFormError(null);
    setEditTarget(null);
    setCreateOpen(true);
  }
  function openEdit(user: TenantUserEditTarget) {
    setEditTarget(user);
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setEmail(user.email);
    setRole(user.role as SubTenantRole);
    setAccountStatus(
      user.membershipStatus === "DISABLED" ? "INACTIVE" : "ACTIVE",
    );
    setFormError(null);
    setCreateOpen(true);
  }
  return {
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
  };
}

export type TenantUserDialogState = ReturnType<typeof useTenantUserDialogState>;

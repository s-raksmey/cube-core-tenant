"use client";

import { useQuery } from "@apollo/client/react";
import { TENANT_ROLE_PERMISSION_SUMMARY_QUERY } from "@/lib/apollo/operations";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const permissions = [
  ["USERS_VIEW", "View users"],
  ["USERS_CREATE", "Create users"],
  ["USERS_EDIT", "Edit users"],
  ["USERS_CHANGE_ROLE", "Change user roles"],
  ["USERS_ACTIVATE", "Activate users"],
  ["USERS_SUSPEND", "Suspend users"],
  ["USERS_RESET_PASSWORD", "Reset password"],
  ["USERS_DELETE", "Delete users"],
] as const;

type Role = "ADMIN" | "EDITOR";
type Permission = (typeof permissions)[number][0];

function ReadOnlySwitch({ checked, label, role }: { checked: boolean; label: string; role: Role }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={`${label} for ${role}: ${checked ? "enabled" : "disabled"}`} disabled className={["relative h-5 w-9 cursor-not-allowed rounded-full opacity-75", checked ? "bg-primary" : "bg-muted-foreground/25"].join(" ")}><span className={["absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-xs", checked ? "translate-x-4" : "translate-x-0"].join(" ")} /></button>;
}

export function TenantRolePermissionsPanel() {
  const { data, loading, error } = useQuery(TENANT_ROLE_PERMISSION_SUMMARY_QUERY, { fetchPolicy: "cache-first" });
  const byRole = new Map((data?.tenantRolePermissionSummary ?? []).map((role) => [role.role as Role, new Set(role.permissions as Permission[])]));

  return <div className="space-y-5">
    <PageHeader title="Roles & Permissions" description="Review the user-management permissions configured by your SuperAdmin." crumbs={[{ label: "Workspace", href: "/dashboard" }, { label: "Roles & Permissions" }]} />
    {loading && !data ? <p className="text-sm text-muted-foreground">Loading role permissions…</p> : null}
    {error ? <p className="text-sm text-destructive">Unable to load role permissions.</p> : null}
    <Card className="max-w-5xl overflow-hidden py-0">
      <CardHeader className="gap-1 border-b px-5 py-4"><CardTitle className="text-base">User Management</CardTitle><CardDescription>These permissions are managed in the Main Console.</CardDescription></CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-[minmax(220px,1fr)_120px_120px] items-center border-b bg-muted/25 px-6 py-3"><span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Permission</span><div className="text-center text-sm font-medium">Admin</div><div className="text-center text-sm font-medium">Editor</div></div>
        {permissions.map(([permission, label]) => <div key={permission} className="grid min-h-13 grid-cols-[minmax(220px,1fr)_120px_120px] items-center border-b px-6 last:border-b-0"><span className="pr-4 text-sm font-medium">{label}</span>{(["ADMIN", "EDITOR"] as const).map((role) => <div key={role} className="flex justify-center"><ReadOnlySwitch checked={byRole.get(role)?.has(permission) ?? false} label={label} role={role} /></div>)}</div>)}
      </CardContent>
    </Card>
  </div>;
}

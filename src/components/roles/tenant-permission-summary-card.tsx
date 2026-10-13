import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TENANT_PERMISSION_ROLES,
  type TenantPermissionRole,
} from "@/types/role-permission.types";

function ReadOnlySwitch({
  checked,
  label,
  role,
}: {
  checked: boolean;
  label: string;
  role: TenantPermissionRole;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${label} for ${role}: ${checked ? "enabled" : "disabled"}`}
      disabled
      className={[
        "relative h-5 w-9 cursor-not-allowed rounded-full opacity-75",
        checked ? "bg-primary" : "bg-muted-foreground/25",
      ].join(" ")}
    >
      <span
        className={[
          "absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-xs",
          checked ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

export function TenantPermissionSummaryCard({
  title,
  rows,
  permissionsByRole,
}: {
  title: string;
  rows: readonly (readonly [string, string])[];
  permissionsByRole: Map<string, Set<string>>;
}) {
  return (
    <Card className="max-w-5xl overflow-hidden py-0">
      <CardHeader className="gap-1 border-b px-5 py-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          These permissions are managed in the Main Console.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-[minmax(220px,1fr)_120px_120px] items-center border-b bg-muted/25 px-6 py-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Permission
          </span>
          <div className="text-center text-sm font-medium">Admin</div>
          <div className="text-center text-sm font-medium">Editor</div>
        </div>
        {rows.map(([permission, label]) => (
          <div
            key={permission}
            className="grid min-h-13 grid-cols-[minmax(220px,1fr)_120px_120px] items-center border-b px-6 last:border-b-0"
          >
            <span className="pr-4 text-sm font-medium">{label}</span>
            {TENANT_PERMISSION_ROLES.map((role) => (
              <div key={role} className="flex justify-center">
                <ReadOnlySwitch
                  checked={permissionsByRole.get(role)?.has(permission) ?? false}
                  label={label}
                  role={role}
                />
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

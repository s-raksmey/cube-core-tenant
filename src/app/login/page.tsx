import { cache, Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { TenantAuthFlow } from "@/components/auth/tenant-auth-flow";
import { TenantUnavailable } from "@/components/auth/tenant-unavailable";
import {
  managementHostFromHeader,
  resolveTenantByHostname,
  resolveLocalDevelopmentTenant,
  type ManagementHostResolution,
} from "@/lib/tenant-hostname";

const lookupLocalDevelopmentTenant = cache(async () => {
  try {
    return await resolveLocalDevelopmentTenant();
  } catch {
    return null;
  }
});

const lookupTenantByHostname = cache(async (hostname: string) => {
  try {
    const tenant = await resolveTenantByHostname(hostname);
    return tenant?.type === "SUB" && tenant.status === "ACTIVE" ? tenant : null;
  } catch {
    return null;
  }
});

async function resolveTenant(
  host: ManagementHostResolution,
) {
  if (host.kind === "domain") return lookupTenantByHostname(host.hostname);
  if (host.kind === "local" && process.env.NODE_ENV !== "production") {
    return lookupLocalDevelopmentTenant();
  }
  return null;
}

async function TenantLogin({
  host,
}: {
  host: ManagementHostResolution;
}) {
  const tenant = await resolveTenant(host);
  if (!tenant) return <TenantUnavailable />;
  return (
    <TenantAuthFlow
      tenantName={tenant.name}
    />
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const host = managementHostFromHeader((await headers()).get("host"));
  const tenant = await resolveTenant(host);
  return { title: tenant ? `Sign in to ${tenant.name}` : "Tenant unavailable" };
}

async function TenantLoginForRequest() {
  const host = managementHostFromHeader((await headers()).get("host"));
  return <TenantLogin host={host} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          Preparing sign-in…
        </div>
      }
    >
      <TenantLoginForRequest />
    </Suspense>
  );
}

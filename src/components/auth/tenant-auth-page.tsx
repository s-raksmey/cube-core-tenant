import { cache } from "react";
import { Suspense } from "react";
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

async function resolveTenant(host: ManagementHostResolution) {
  if (host.kind === "domain") return lookupTenantByHostname(host.hostname);
  if (host.kind === "local" && process.env.NODE_ENV !== "production") {
    return lookupLocalDevelopmentTenant();
  }
  return null;
}

export async function tenantAuthMetadata(): Promise<Metadata> {
  const host = managementHostFromHeader((await headers()).get("host"));
  const tenant = await resolveTenant(host);
  return {
    title: tenant?.name ?? "Tenant unavailable",
    ...(tenant?.faviconUrl
      ? {
          icons: {
            icon: `/tenant-assets/${tenant.faviconUrl.replace(/^\/storage\//, "")}`,
          },
        }
      : {}),
  };
}

async function TenantAuthForRequest({ showLogin }: { showLogin: boolean }) {
  const host = managementHostFromHeader((await headers()).get("host"));
  const tenant = await resolveTenant(host);
  if (!tenant) return <TenantUnavailable />;

  return (
    <TenantAuthFlow
      key={showLogin ? "login" : "landing"}
      tenantName={tenant.name}
      managementLogoUrl={tenant.managementLogoUrl}
      initialStep={showLogin ? "password" : "landing"}
    />
  );
}

function TenantAuthLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading tenant workspace"
      className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-20 size-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative text-sm text-muted-foreground">
        Loading workspace…
      </div>
    </main>
  );
}

export function TenantAuthPage({ showLogin = false }: { showLogin?: boolean }) {
  return (
    <Suspense fallback={<TenantAuthLoading />}>
      <TenantAuthForRequest showLogin={showLogin} />
    </Suspense>
  );
}

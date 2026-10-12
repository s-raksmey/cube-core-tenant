import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import { ConsoleGate } from "@/components/dashboard/console-gate";
import {
  managementHostFromHeader,
  resolveLocalDevelopmentTenant,
  resolveTenantByHostname,
} from "@/lib/tenant-hostname";

function tenantMetadata(name: string): Metadata {
  return { title: name };
}

export async function generateMetadata(): Promise<Metadata> {
  // Tenant resolution reads the current access token, whose expiry is evaluated
  // with the current time. Metadata must therefore be request-time rendered.
  await connection();
  const host = managementHostFromHeader((await headers()).get("host"));

  try {
    const tenant =
      host.kind === "domain"
        ? await resolveTenantByHostname(host.hostname)
        : host.kind === "local" && process.env.NODE_ENV !== "production"
          ? await resolveLocalDevelopmentTenant()
          : null;

    if (host.kind === "local" && tenant) {
      return tenantMetadata(tenant.name);
    }
    if (tenant && "type" in tenant && tenant.type === "SUB" && tenant.status === "ACTIVE") {
      return tenantMetadata(tenant.name);
    }
  } catch {
    // The console gate renders the unavailable or sign-in state.
  }

  return { title: "Tenant unavailable" };
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsoleGate>{children}</ConsoleGate>;
}

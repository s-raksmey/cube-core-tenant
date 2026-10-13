import "server-only";

import {
  LocalDevelopmentTenantDocument,
  TenantByHostnameDocument,
} from "@/lib/apollo/generated/graphql";
import { serverGraphql } from "@/lib/auth/graphql";

export type ManagementHostResolution =
  | { kind: "local" }
  | { kind: "shared" }
  | { kind: "domain"; hostname: string }
  | { kind: "invalid" };

function parseHostname(value: string | null) {
  if (!value || /[\/@?#\s]/.test(value)) return null;
  try {
    return new URL(`http://${value}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Use Host from the incoming request; do not trust X-Forwarded-Host here. */
export function managementHostFromHeader(
  hostHeader: string | null,
): ManagementHostResolution {
  const hostname = parseHostname(hostHeader);
  if (!hostname) return { kind: "invalid" };

  if (hostname === "localhost") {
    return { kind: "local" };
  }

  const sharedHost = parseHostname(
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.TENANT_APP_URL ?? null,
  );
  if (sharedHost && hostname === sharedHost) return { kind: "shared" };

  return { kind: "domain", hostname };
}

export function managementHostFromRequest(request: Request) {
  return managementHostFromHeader(request.headers.get("host"));
}

export async function resolveLocalDevelopmentTenant() {
  const result = await serverGraphql(
    LocalDevelopmentTenantDocument,
    {},
    "localDevelopmentTenant",
  );
  if (!result.ok) throw new Error("Unable to resolve the local tenant");
  return result.payload;
}

export async function resolveTenantByHostname(hostname: string) {
  const result = await serverGraphql(
    TenantByHostnameDocument,
    { hostname, purpose: "MANAGEMENT" },
    "tenantByHostname",
  );
  if (!result.ok) throw new Error("Unable to resolve the management domain");
  return result.payload;
}

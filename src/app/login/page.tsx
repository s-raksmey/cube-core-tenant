import { TenantAuthPage, tenantAuthMetadata } from "@/components/auth/tenant-auth-page";

// Tenant identity is resolved from the current host at request time.
export const instant = false;
export const generateMetadata = tenantAuthMetadata;

export default function LoginPage() {
  return <TenantAuthPage showLogin />;
}

import { TenantAuthPage, tenantAuthMetadata } from "@/components/auth/tenant-auth-page";

export const generateMetadata = tenantAuthMetadata;

export default function LoginPage() {
  return <TenantAuthPage showLogin />;
}

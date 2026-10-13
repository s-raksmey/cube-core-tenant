import { ConsoleGate } from "@/components/dashboard/console-gate";
import { tenantAuthMetadata } from "@/components/auth/tenant-auth-page";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";

// Use the same cached tenant metadata as the landing page so browser chrome
// has the tenant name and favicon before the workspace hydrates.
export const generateMetadata = tenantAuthMetadata;

async function WorkspaceRoute({ children }: { children: ReactNode }) {
  // ConsoleGate validates the session in the client. Keeping this wrapper
  // request-rendered prevents child workspace routes from being dropped.
  await connection();
  return <ConsoleGate>{children}</ConsoleGate>;
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <WorkspaceRoute>{children}</WorkspaceRoute>
    </Suspense>
  );
}

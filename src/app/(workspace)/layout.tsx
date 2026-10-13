import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { ConsoleGate } from "@/components/dashboard/console-gate";

// ConsoleShell sets the authenticated tenant name after the session check.
// Keeping workspace metadata static avoids a second tenant lookup on every route.
export const metadata: Metadata = { title: "Tenant workspace" };

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

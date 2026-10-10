"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { ME_QUERY } from "@/lib/apollo/operations";
import { ConsoleShell } from "@/components/dashboard/console-shell";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuthUser } from "@/lib/types";

function isTenantRole(user: AuthUser) {
  return (
    (user.role === "ADMIN" || user.role === "EDITOR") &&
    user.tenant.type === "SUB"
  );
}

export function ConsoleGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const redirected = useRef(false);
  const { data, loading, refetch } = useQuery(ME_QUERY, {
    fetchPolicy: "network-only",
    errorPolicy: "all",
  });
  const user = data?.me ?? null;
  const allowed = !!user && isTenantRole(user);
  const ready = !loading && allowed;

  useEffect(() => {
    if (loading || redirected.current) return;
    if (allowed) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const result = await refetch();
        if (cancelled) return;
        const next = result.data?.me ?? null;
        if (next && isTenantRole(next)) return;
        redirected.current = true;
        router.replace("/login");
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loading, allowed, refetch, router]);

  if (!ready) {
    return (
      <>
        <div className="flex min-h-svh items-center justify-center bg-background p-6">
          <div className="w-full max-w-md space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-2/3" />
            <p className="text-center text-sm text-muted-foreground">
              Opening workspace…
            </p>
          </div>
        </div>
        <div hidden aria-hidden>
          {children}
        </div>
      </>
    );
  }

  return <ConsoleShell user={user}>{children}</ConsoleShell>;
}

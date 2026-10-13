"use client";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { AuthUser } from "@/lib/types";
import { clearTenantSession } from "@/lib/auth/session-actions";
import { tenantDocumentTitleStorageKey } from "@/lib/tenant-document-title";
import { useApolloClient } from "@apollo/client/react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayoutEffect, type CSSProperties } from "react";

export function ConsoleShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const apollo = useApolloClient();

  useLayoutEffect(() => {
    document.title = user.tenant.name;
    localStorage.setItem(tenantDocumentTitleStorageKey, user.tenant.name);
  }, [user.tenant.name]);

  async function handleLogout() {
    try {
      await clearTenantSession();
    } finally {
      await apollo.clearStore();
      router.replace("/");
    }
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width-icon": "2.75rem" } as CSSProperties}
    >
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <p className="truncate text-sm text-muted-foreground">
              {user.tenant.name} workspace
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="shrink-0"
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

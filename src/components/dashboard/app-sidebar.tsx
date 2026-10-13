"use client";

import Link from "next/link";
import Image from "next/image";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Activity,
  FileText,
  ImageIcon,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import type { AuthUser } from "@/lib/types";
import { TENANT_USER_PERMISSIONS_QUERY } from "@/lib/apollo/operations";

const MY_BRANDING = gql`query SidebarBranding { myTenantBranding { managementLogoUrl faviconUrl } }`;
const storageBase = process.env.NEXT_PUBLIC_GRAPHQL_SERVER_URL?.replace(/\/graphql$/, "") ?? "http://localhost:4000";

function tenantAssetPath(path: string) {
  return `/tenant-assets/${path.replace(/^\/storage\//, "")}`;
}

function faviconMimeType(path: string) {
  const extension = path.split(".").pop()?.toLowerCase();
  return (
    {
      ico: "image/x-icon",
      png: "image/png",
      svg: "image/svg+xml",
      webp: "image/webp",
    }[extension ?? ""] ?? "image/x-icon"
  );
}

function applyTenantFavicon(path: string | null | undefined) {
  const existing = document.querySelector<HTMLLinkElement>(
    "link[data-tenant-favicon]",
  );

  if (!path) {
    existing?.remove();
    return;
  }

  const link = existing ?? document.createElement("link");
  link.dataset.tenantFavicon = "true";
  link.rel = "icon";
  link.type = faviconMimeType(path);
  // Every uploaded asset has its own path, which provides a stable cache key.
  link.href = tenantAssetPath(path);

  if (!existing) {
    document.head.appendChild(link);
  }
}

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Users", href: "/users", icon: Users },
  { title: "Roles & Permissions", href: "/roles", icon: ShieldCheck },
  { title: "Content", href: "/content", icon: FileText },
  { title: "Media", href: "/media", icon: ImageIcon },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Audit Logs", href: "/audit", icon: Activity },
];

const editorNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Users", href: "/users", icon: Users },
  { title: "Roles & Permissions", href: "/roles", icon: ShieldCheck },
  { title: "Content", href: "/content", icon: FileText },
  { title: "Media", href: "/media", icon: ImageIcon },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Audit Logs", href: "/audit", icon: Activity },
];

function tenantInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CC";
}

export function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const { data } = useQuery(TENANT_USER_PERMISSIONS_QUERY);
  const canViewUsers = data?.tenantUserPermissions?.includes("USERS_VIEW") ?? false;
  const canViewSettings = data?.tenantUserPermissions?.includes("BRANDING_VIEW") ?? false;
  const { data: brandingData, refetch: refetchBranding } = useQuery<{
    myTenantBranding: {
      managementLogoUrl: string | null;
      faviconUrl: string | null;
    };
  }>(MY_BRANDING);
  const managementLogoUrl = brandingData?.myTenantBranding.managementLogoUrl;
  const faviconUrl = brandingData?.myTenantBranding.faviconUrl;
  useEffect(() => {
    applyTenantFavicon(faviconUrl);
  }, [faviconUrl]);
  useEffect(() => {
    const refreshBranding = () => {
      void refetchBranding();
    };
    window.addEventListener("tenant-branding-updated", refreshBranding);
    return () => window.removeEventListener("tenant-branding-updated", refreshBranding);
  }, [refetchBranding]);
  const items = (user.role === "EDITOR" ? editorNav : adminNav).filter(
    (item) =>
      (item.href !== "/users" || canViewUsers) &&
      (item.href !== "/settings" || canViewSettings),
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-14 flex-row items-center border-b border-sidebar-border p-0 px-3 group-data-[collapsible=icon]:px-1.5">
        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          {managementLogoUrl ? <Image src={`${storageBase}${managementLogoUrl}`} alt={`${user.tenant.name} logo`} width={32} height={32} unoptimized className="size-8 object-contain" /> : tenantInitials(user.tenant.name)}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="text-sidebar-foreground hover:text-sidebar-accent-foreground data-active:text-sidebar-accent-foreground"
                    >
                      <Link href={item.href} className="no-underline">
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent p-3 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
            {user.tenant.name}
          </p>
          <p className="truncate text-xs text-sidebar-foreground/70">
            {user.email}
          </p>
          <Badge className="mt-2 bg-sidebar-primary text-sidebar-primary-foreground">
            {user.role}
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

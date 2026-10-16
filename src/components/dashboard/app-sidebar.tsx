"use client";

import { Badge } from "@/components/ui/badge";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useTenantSidebarBranding } from "@/hooks/use-tenant-sidebar-branding";
import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";
import type { AuthUser } from "@/lib/types";
import {
  Activity,
  ChartNoAxesCombined,
  ChevronDown,
  FileText,
  ImageIcon,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
const storageBase =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER_URL?.replace(/\/graphql$/, "") ??
  "http://localhost:4000";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
  { title: "Users", href: "/users", icon: Users },
  { title: "Roles & Permissions", href: "/roles", icon: ShieldCheck },
  { title: "Media", href: "/media", icon: ImageIcon },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Audit Logs", href: "/audit", icon: Activity },
];

const editorNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
  { title: "Users", href: "/users", icon: Users },
  { title: "Roles & Permissions", href: "/roles", icon: ShieldCheck },
  { title: "Media", href: "/media", icon: ImageIcon },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Audit Logs", href: "/audit", icon: Activity },
];

function tenantInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "CC"
  );
}

export function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const [contentOpen, setContentOpen] = useState(
    pathname.startsWith("/content"),
  );
  const {
    canViewUsers,
    canViewSettings,
    canViewCategories,
    canViewTags,
    canViewArticles,
  } = useTenantUserPermissions();
  const { managementLogoUrl } = useTenantSidebarBranding();
  const items = (user.role === "EDITOR" ? editorNav : adminNav).filter(
    (item) =>
      (item.href !== "/users" || canViewUsers) &&
      (item.href !== "/settings" || canViewSettings),
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-14 flex-row items-center border-b border-sidebar-border p-0 px-3 group-data-[collapsible=icon]:px-1.5">
        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          {managementLogoUrl ? (
            <Image
              src={`${storageBase}${managementLogoUrl}`}
              alt={`${user.tenant.name} logo`}
              width={32}
              height={32}
              unoptimized
              className="size-8 object-contain"
            />
          ) : (
            tenantInitials(user.tenant.name)
          )}
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
                      <Link
                        href={item.href}
                        className="no-underline"
                        onClick={() => {
                          document.title = user.tenant.name;
                        }}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {canViewArticles || canViewCategories || canViewTags ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname.startsWith("/content")}
                    tooltip="Content"
                    onClick={() => setContentOpen((open) => !open)}
                    className="text-sidebar-foreground hover:text-sidebar-accent-foreground data-active:text-sidebar-accent-foreground"
                  >
                    <FileText />
                    <span>Content</span>
                    <ChevronDown
                      className={`ml-auto transition-transform group-data-[collapsible=icon]:hidden ${contentOpen ? "rotate-180" : ""}`}
                    />
                  </SidebarMenuButton>
                  {contentOpen ? (
                    <SidebarMenuSub>
                      {canViewArticles ? (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === "/content/articles"}
                          >
                            <Link href="/content/articles">
                              <FileText />
                              <span>Articles</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ) : null}
                      {canViewCategories ? (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === "/content/categories"}
                          >
                            <Link href="/content/categories">
                              <Tags />
                              <span>Categories</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ) : null}
                      {canViewTags ? (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === "/content/tags"}
                          >
                            <Link href="/content/tags">
                              <Tags />
                              <span>Tags</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ) : null}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ) : null}
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

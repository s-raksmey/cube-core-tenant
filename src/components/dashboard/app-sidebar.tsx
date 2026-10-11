"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  FileText,
  ImageIcon,
  LayoutDashboard,
  Settings,
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

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Users", href: "/users", icon: Users },
  { title: "Content", href: "/content", icon: FileText },
  { title: "Media", href: "/media", icon: ImageIcon },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Audit Logs", href: "/audit", icon: Activity },
];

const editorNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Content", href: "/content", icon: FileText },
  { title: "Media", href: "/media", icon: ImageIcon },
  { title: "Audit Logs", href: "/audit", icon: Activity },
];

export function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const items = user.role === "EDITOR" ? editorNav : adminNav;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-14 flex-row items-center gap-3 border-b border-sidebar-border p-0 px-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          CC
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

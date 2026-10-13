"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import Image from "next/image";

import type { AuthUser } from "@/lib/types";

const MY_MANAGEMENT_BRANDING = gql`
  query DashboardManagementBranding {
    myTenantBranding {
      managementLogoUrl
    }
  }
`;

const storageBase =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER_URL?.replace(/\/graphql$/, "") ??
  "http://localhost:4000";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function TenantLandingHero({ user }: { user: AuthUser }) {
  const { data } = useQuery<{
    myTenantBranding: { managementLogoUrl: string | null };
  }>(MY_MANAGEMENT_BRANDING);
  const logo = data?.myTenantBranding.managementLogoUrl;
  const roleLabel =
    user.role === "ADMIN" ? "Tenant administration" : "Editor workspace";

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div>
          <p className="text-sm font-medium text-primary">{roleLabel}</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">
            {user.tenant.name}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Manage the workspace and publishing activity for this sub-tenant.
          </p>
        </div>
        <div className="relative mx-auto flex aspect-square w-full max-w-44 items-center justify-center p-6">
          {logo ? (
            <Image
              src={`${storageBase}${logo}`}
              alt={`${user.tenant.name} logo`}
              fill
              unoptimized
              sizes="176px"
              className="p-6 object-contain"
            />
          ) : (
            <span className="text-4xl font-semibold text-muted-foreground">
              {initials(user.tenant.name)}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

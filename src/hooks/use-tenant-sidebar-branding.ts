"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useEffect } from "react";

const SIDEBAR_BRANDING = gql`
  query SidebarBranding {
    myTenantBranding {
      managementLogoUrl
      faviconUrl
    }
  }
`;

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
  link.href = tenantAssetPath(path);
  if (!existing) document.head.appendChild(link);
}

export function useTenantSidebarBranding() {
  const query = useQuery<{
    myTenantBranding: {
      managementLogoUrl: string | null;
      faviconUrl: string | null;
    };
  }>(SIDEBAR_BRANDING);
  const branding = query.data?.myTenantBranding;
  const { refetch } = query;

  useEffect(() => {
    applyTenantFavicon(branding?.faviconUrl);
  }, [branding?.faviconUrl]);
  useEffect(() => {
    const refreshBranding = () => void refetch();
    window.addEventListener("tenant-branding-updated", refreshBranding);
    return () =>
      window.removeEventListener("tenant-branding-updated", refreshBranding);
  }, [refetch]);

  return {
    managementLogoUrl: branding?.managementLogoUrl ?? null,
    tenantAssetPath,
  };
}

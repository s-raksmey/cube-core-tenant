"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const MY_MANAGEMENT_BRANDING = gql`
  query DashboardManagementBranding {
    myTenantBranding {
      managementLogoUrl
    }
  }
`;

export function useTenantManagementBranding() {
  const query = useQuery<{
    myTenantBranding: { managementLogoUrl: string | null };
  }>(MY_MANAGEMENT_BRANDING);
  return {
    ...query,
    managementLogoUrl: query.data?.myTenantBranding.managementLogoUrl ?? null,
  };
}
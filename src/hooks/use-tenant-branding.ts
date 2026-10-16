"use client";

import type { BrandingRecord } from "@/types/branding.types";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";

const TENANT_BRANDING = gql`
  query MyBranding {
    myTenantBranding {
      managementLogoUrl
      websiteLogoUrl
      faviconUrl
      publicWebsiteFaviconUrl
    }
  }
`;
const UPDATE_TENANT_BRANDING = gql`
  mutation UpdateMyTenantBranding(
    $asset: BrandingAsset!
    $fileName: String!
    $mimeType: String!
    $contentBase64: String
  ) {
    updateMyTenantBranding(
      asset: $asset
      fileName: $fileName
      mimeType: $mimeType
      contentBase64: $contentBase64
    ) {
      faviconUrl
      publicWebsiteFaviconUrl
    }
  }
`;

export function useTenantBranding({ canView }: { canView: boolean }) {
  const query = useQuery<{ myTenantBranding: BrandingRecord }>(
    TENANT_BRANDING,
    { skip: !canView },
  );
  const [updateBranding, mutation] = useMutation(UPDATE_TENANT_BRANDING);
  return { ...query, updateBranding, saving: mutation.loading };
}

import type {
  BrandingAsset,
  BrandingAssetConfig,
  BrandingRecord,
} from "@/types/branding.types";
import { Globe, ImageIcon, Monitor, Share2 } from "lucide-react";

export const BRANDING_FIELDS: Record<BrandingAsset, keyof BrandingRecord> = {
  MANAGEMENT_LOGO: "managementLogoUrl",
  WEBSITE_LOGO: "websiteLogoUrl",
  FAVICON: "faviconUrl",
  PUBLIC_WEBSITE_FAVICON: "publicWebsiteFaviconUrl",
  OPEN_GRAPH_IMAGE: "openGraphImageUrl",
};

export const BRANDING_ASSETS: BrandingAssetConfig[] = [
  {
    asset: "MANAGEMENT_LOGO",
    title: "Management logo",
    description: "Shown in this tenant workspace navigation.",
    placement: "Management Console",
    icon: Monitor,
    preview: "logo",
  },
  {
    asset: "WEBSITE_LOGO",
    title: "Website logo",
    description: "Used in the header of this tenant’s public site.",
    placement: "Public Website",
    icon: Globe,
    preview: "logo",
  },
  {
    asset: "FAVICON",
    title: "Management console favicon",
    description: "The small icon shown in this tenant workspace browser tabs.",
    placement: "Management Console",
    icon: ImageIcon,
    preview: "favicon",
  },
  {
    asset: "PUBLIC_WEBSITE_FAVICON",
    title: "Public website favicon",
    description:
      "The small icon shown in the public website browser tabs and bookmarks.",
    placement: "Public Website",
    icon: ImageIcon,
    preview: "favicon",
  },
];

export const SEO_IMAGE_ASSET: BrandingAssetConfig = {
  asset: "OPEN_GRAPH_IMAGE",
  title: "Social sharing image",
  description: "Shown when the public site is shared on social platforms.",
  placement: "SEO & Social Sharing",
  icon: Share2,
  preview: "social",
};

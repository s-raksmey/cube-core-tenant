import type { LucideIcon } from "lucide-react";

export type BrandingAsset =
  | "MANAGEMENT_LOGO"
  | "WEBSITE_LOGO"
  | "FAVICON"
  | "PUBLIC_WEBSITE_FAVICON"
  | "OPEN_GRAPH_IMAGE";

export type BrandingRecord = Record<string, string | null>;
export type PreviewKind = "logo" | "favicon" | "social";

export type BrandingAssetConfig = {
  asset: BrandingAsset;
  title: string;
  description: string;
  placement: string;
  icon: LucideIcon;
  preview: PreviewKind;
};

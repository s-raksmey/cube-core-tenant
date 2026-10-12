"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Globe,
  ImageIcon,
  Monitor,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TENANT_USER_PERMISSIONS_QUERY } from "@/lib/apollo/operations";

const BRANDING = gql`
  query MyBranding {
    myTenantBranding {
      managementLogoUrl
      websiteLogoUrl
      faviconUrl
      publicWebsiteFaviconUrl
      openGraphImageUrl
    }
  }
`;
const UPDATE = gql`
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
      managementLogoUrl
      websiteLogoUrl
      faviconUrl
      publicWebsiteFaviconUrl
      openGraphImageUrl
    }
  }
`;

type Asset =
  | "MANAGEMENT_LOGO"
  | "WEBSITE_LOGO"
  | "FAVICON"
  | "PUBLIC_WEBSITE_FAVICON"
  | "OPEN_GRAPH_IMAGE";
type BrandingRecord = Record<string, string | null>;
type PendingAssetAction =
  | { type: "replace"; asset: Asset; file: File }
  | { type: "remove"; asset: Asset };
const fields: Record<Asset, keyof BrandingRecord> = {
  MANAGEMENT_LOGO: "managementLogoUrl",
  WEBSITE_LOGO: "websiteLogoUrl",
  FAVICON: "faviconUrl",
  PUBLIC_WEBSITE_FAVICON: "publicWebsiteFaviconUrl",
  OPEN_GRAPH_IMAGE: "openGraphImageUrl",
};
const base =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER_URL?.replace(/\/graphql$/, "") ??
  "http://localhost:4000";

const assets: Array<{
  asset: Asset;
  title: string;
  description: string;
  placement: string;
  icon: typeof Monitor;
  preview: "logo" | "favicon" | "social";
}> = [
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
    description: "The small icon shown in the public website browser tabs and bookmarks.",
    placement: "Public Website",
    icon: ImageIcon,
    preview: "favicon",
  },
  {
    asset: "OPEN_GRAPH_IMAGE",
    title: "Social sharing image",
    description: "Shown when the public site is shared on social platforms.",
    placement: "SEO & Social Sharing",
    icon: Share2,
    preview: "social",
  },
];

function AssetPreview({
  url,
  alt,
  variant,
}: {
  url: string | null;
  alt: string;
  variant: "logo" | "favicon" | "social";
}) {
  const imageUrl = url ? `${base}${url}` : null;
  if (variant === "social")
    return (
      <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            unoptimized
            loading="eager"
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="text-center text-xs text-muted-foreground">
            <Share2 className="mx-auto mb-2 size-5" />
            No social image uploaded
          </div>
        )}
      </div>
    );
  return (
    <div className="relative flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-4">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          unoptimized
          sizes="240px"
          className="p-4 object-contain"
        />
      ) : (
        <div className="text-center text-xs text-muted-foreground">
          <ImageIcon className="mx-auto mb-1 size-4" />
          Default branding
        </div>
      )}
    </div>
  );
}

function BrandingAssetCard({
  config,
  url,
  selectedFile,
  removalPending,
  canEdit,
  saving,
  onSelect,
  onRemove,
  onSave,
}: {
  config: (typeof assets)[number];
  url: string | null;
  selectedFile?: File;
  removalPending: boolean;
  canEdit: boolean;
  saving: boolean;
  onSelect: (asset: Asset, file?: File) => void;
  onRemove: (asset: Asset) => void;
  onSave: (asset: Asset) => void;
}) {
  const inputId = useId();
  const Icon = config.icon;
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {config.placement}
          </p>
          <h2 className="mt-0.5 font-semibold text-foreground">
            {config.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {config.description}
          </p>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <AssetPreview
          url={removalPending ? null : url}
          alt={config.title}
          variant={config.preview}
        />
        {canEdit ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={inputId}
              type="file"
              className="sr-only"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
              disabled={saving}
              onChange={(event) => {
                onSelect(config.asset, event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <Button type="button" size="sm" disabled={saving} asChild>
              <label htmlFor={inputId} className="cursor-pointer">
                <Upload className="size-4" />
                {selectedFile
                  ? "Replace selected image"
                  : url && !removalPending
                    ? "Replace image"
                    : "Upload image"}
              </label>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={saving || (!selectedFile && !removalPending)}
              onClick={() => onSave(config.asset)}
            >
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={saving || !url || removalPending}
              onClick={() => onRemove(config.asset)}
            >
              <Trash2 className="size-4 text-destructive" />
              Remove
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">View only</p>
        )}
        <p className="text-xs text-muted-foreground">
          PNG, JPEG, WebP, SVG, or ICO · Maximum 1,000 KB
        </p>
        {selectedFile ? (
          <p className="text-xs text-primary">
            Selected: {selectedFile.name}. Save changes to upload it.
          </p>
        ) : null}
        {removalPending ? (
          <p className="text-xs text-destructive">
            This image will be removed when you save changes.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function TenantBrandingPanel() {
  const { data: permissionData, loading: permissionsLoading } = useQuery(
    TENANT_USER_PERMISSIONS_QUERY,
    { fetchPolicy: "cache-first" },
  );
  const canView =
    permissionData?.tenantUserPermissions?.includes("BRANDING_VIEW") ?? false;
  const canEdit =
    permissionData?.tenantUserPermissions?.includes("BRANDING_UPDATE") ?? false;
  const { data, loading, error, refetch } = useQuery<{
    myTenantBranding: BrandingRecord;
  }>(BRANDING, { skip: permissionsLoading || !canView });
  const [update, { loading: saving }] = useMutation(UPDATE);
  const [message, setMessage] = useState<string | null>(null);
  const [changes, setChanges] = useState<Partial<Record<Asset, File | null>>>(
    {},
  );
  const [confirmAssets, setConfirmAssets] = useState<Asset[] | null>(null);
  const [pendingAssetAction, setPendingAssetAction] =
    useState<PendingAssetAction | null>(null);
  const hasChanges = Object.keys(changes).length > 0;

  function requestReplace(asset: Asset, file?: File) {
    if (!file) return;
    if (file.size > 1000 * 1024) {
      setMessage("Choose an image smaller than 1,000 KB.");
      return;
    }
    setPendingAssetAction({ type: "replace", asset, file });
  }

  function markForRemoval(asset: Asset) {
    const existingUrl = data?.myTenantBranding?.[fields[asset]] ?? null;
    setChanges((current) => {
      if (!existingUrl) {
        const next = { ...current };
        delete next[asset];
        return next;
      }
      return { ...current, [asset]: null };
    });
    setMessage(null);
  }

  function confirmAssetAction() {
    if (!pendingAssetAction) return;
    if (pendingAssetAction.type === "replace") {
      setChanges((current) => ({
        ...current,
        [pendingAssetAction.asset]: pendingAssetAction.file,
      }));
      setMessage(null);
    } else {
      markForRemoval(pendingAssetAction.asset);
    }
    setPendingAssetAction(null);
  }

  async function saveChanges(assetsToSave: Asset[]) {
    setConfirmAssets(null);
    setMessage(null);
    try {
      let savedFaviconUrl: string | null | undefined;
      for (const config of assets) {
        if (!assetsToSave.includes(config.asset)) continue;
        const change = changes[config.asset];
        if (change === undefined) continue;
        if (change === null) {
          const result = await update({
            variables: {
              asset: config.asset,
              fileName: "remove",
              mimeType: "image/png",
              contentBase64: null,
            },
          });
          if (config.asset === "FAVICON") savedFaviconUrl = (result.data as { updateMyTenantBranding?: { faviconUrl?: string | null } } | undefined)?.updateMyTenantBranding?.faviconUrl;
          continue;
        }
        const contentBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve(String(reader.result).split(",")[1] ?? "");
          reader.onerror = reject;
          reader.readAsDataURL(change);
        });
        const result = await update({
          variables: {
            asset: config.asset,
            fileName: change.name,
            mimeType: change.type,
            contentBase64,
          },
        });
        if (config.asset === "FAVICON") savedFaviconUrl = (result.data as { updateMyTenantBranding?: { faviconUrl?: string | null } } | undefined)?.updateMyTenantBranding?.faviconUrl;
      }
      setChanges((current) => {
        const next = { ...current };
        for (const asset of assetsToSave) delete next[asset];
        return next;
      });
      setMessage(
        assetsToSave.length === 1
          ? "Branding asset saved."
          : "Branding changes saved.",
      );
      await refetch();
      window.dispatchEvent(new CustomEvent("tenant-branding-updated", { detail: { faviconUrl: savedFaviconUrl } }));
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Could not save the image.",
      );
    }
  }
  if (loading || permissionsLoading)
    return <p className="text-sm text-muted-foreground">Loading branding…</p>;
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!canView)
    return (
      <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        You do not have permission to view this tenant’s settings.
      </p>
    );
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-primary/15 bg-primary/5 px-5 py-4">
        <h2 className="font-semibold text-foreground">Brand assets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload images for this tenant workspace and public website. Changes
          are visible after saving.
        </p>
      </section>
      {!canEdit ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          You can view the tenant branding, but only an Admin can edit it.
        </p>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-2">
        {assets.map((config) => {
          const change = changes[config.asset];
          return (
            <BrandingAssetCard
              key={config.asset}
              config={config}
              url={data?.myTenantBranding?.[fields[config.asset]] ?? null}
              selectedFile={change instanceof File ? change : undefined}
              removalPending={change === null}
              canEdit={canEdit}
              saving={saving}
              onSelect={requestReplace}
              onRemove={(asset) =>
                setPendingAssetAction({ type: "remove", asset })
              }
              onSave={(asset) => setConfirmAssets([asset])}
            />
          );
        })}
      </div>
      {canEdit ? (
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-xl border border-border bg-card/95 px-5 py-3 backdrop-blur">
          <p className="text-sm text-muted-foreground">
            {hasChanges
              ? "You have unsaved branding changes."
              : "No unsaved changes."}
          </p>
          <Button
            type="button"
            disabled={!hasChanges || saving}
            onClick={() => setConfirmAssets(Object.keys(changes) as Asset[])}
          >
            {saving ? "Saving…" : "Save all changes"}
          </Button>
        </div>
      ) : null}
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
      <Dialog
        open={confirmAssets !== null}
        onOpenChange={(open) => {
          if (!saving && !open) setConfirmAssets(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAssets?.length === 1
                ? "Save branding asset?"
                : "Save all branding changes?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAssets?.length === 1
                ? "The selected upload or removal will be applied to this tenant."
                : "Your selected images and removals will be applied to this tenant."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setConfirmAssets(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving || !confirmAssets?.length}
              onClick={() => {
                if (confirmAssets) void saveChanges(confirmAssets);
              }}
            >
              {saving
                ? "Saving…"
                : confirmAssets?.length === 1
                  ? "Save"
                  : "Save all changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={pendingAssetAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAssetAction(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingAssetAction?.type === "remove"
                ? "Remove branding image?"
                : "Replace branding image?"}
            </DialogTitle>
            <DialogDescription>
              {pendingAssetAction?.type === "remove"
                ? "This image will be marked for removal. Save the asset or save all changes to apply it."
                : "This image will be staged as a replacement. Save the asset or save all changes to upload it."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingAssetAction(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={
                pendingAssetAction?.type === "remove"
                  ? "destructive"
                  : "default"
              }
              onClick={confirmAssetAction}
            >
              {pendingAssetAction?.type === "remove"
                ? "Remove image"
                : "Stage replacement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

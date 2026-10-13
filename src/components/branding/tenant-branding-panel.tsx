"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import { BrandingAssetCard } from "@/components/branding/branding-asset-card";
import {
  BRANDING_ASSETS,
  BRANDING_FIELDS,
  type BrandingAsset,
  type BrandingRecord,
} from "@/components/branding/branding-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";

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
      faviconUrl
      publicWebsiteFaviconUrl
    }
  }
`;

type PendingAssetAction =
  | { type: "replace"; asset: BrandingAsset; file: File }
  | { type: "remove"; asset: BrandingAsset };

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function TenantBrandingPanel() {
  const { loading: permissionsLoading, canViewBranding: canView, canUpdateBranding: canEdit } = useTenantUserPermissions();
  const { data, loading, error, refetch } = useQuery<{ myTenantBranding: BrandingRecord }>(BRANDING, {
    skip: permissionsLoading || !canView,
  });
  const [update, { loading: saving }] = useMutation(UPDATE);
  const [message, setMessage] = useState<string | null>(null);
  const [changes, setChanges] = useState<Partial<Record<BrandingAsset, File | null>>>({});
  const [confirmAssets, setConfirmAssets] = useState<BrandingAsset[] | null>(null);
  const [pendingAssetAction, setPendingAssetAction] = useState<PendingAssetAction | null>(null);
  const hasChanges = Object.keys(changes).length > 0;
  const branding = data?.myTenantBranding;
  const initialLoading = permissionsLoading || (loading && !branding);

  function requestReplace(asset: BrandingAsset, file?: File) {
    if (!file) return;
    if (file.size > 1000 * 1024) {
      setMessage("Choose an image smaller than 1,000 KB.");
      return;
    }
    setPendingAssetAction({ type: "replace", asset, file });
  }

  function markForRemoval(asset: BrandingAsset) {
    const existingUrl = data?.myTenantBranding?.[BRANDING_FIELDS[asset]] ?? null;
    setChanges((current) => {
      if (existingUrl) return { ...current, [asset]: null };
      const next = { ...current };
      delete next[asset];
      return next;
    });
    setMessage(null);
  }

  function confirmAssetAction() {
    if (!pendingAssetAction) return;
    if (pendingAssetAction.type === "replace") {
      setChanges((current) => ({ ...current, [pendingAssetAction.asset]: pendingAssetAction.file }));
      setMessage(null);
    } else {
      markForRemoval(pendingAssetAction.asset);
    }
    setPendingAssetAction(null);
  }

  async function saveChanges(assetsToSave: BrandingAsset[]) {
    setConfirmAssets(null);
    setMessage(null);
    try {
      let managementFaviconUrl: string | null | undefined;
      for (const asset of assetsToSave) {
        const change = changes[asset];
        if (change === undefined) continue;
        const result = await update({
          variables: change
            ? { asset, fileName: change.name, mimeType: change.type, contentBase64: await fileToBase64(change) }
            : { asset, fileName: "remove", mimeType: "image/png", contentBase64: null },
        });
        if (asset === "FAVICON") {
          managementFaviconUrl = (result.data as { updateMyTenantBranding?: { faviconUrl?: string | null } } | undefined)?.updateMyTenantBranding?.faviconUrl;
        }
      }
      setChanges((current) => {
        const next = { ...current };
        assetsToSave.forEach((asset) => delete next[asset]);
        return next;
      });
      setMessage(assetsToSave.length === 1 ? "Branding asset saved." : "Branding changes saved.");
      await refetch();
      window.dispatchEvent(new CustomEvent("tenant-branding-updated", { detail: { faviconUrl: managementFaviconUrl } }));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not save the image.");
    }
  }

  if (initialLoading) return <p className="text-sm text-muted-foreground">Loading branding…</p>;
  if (error && !branding) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!canView) return <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">You do not have permission to view this tenant’s settings.</p>;

  return <div className="space-y-5">
    <section className="rounded-xl border border-primary/15 bg-primary/5 px-5 py-4"><h2 className="font-semibold text-foreground">Brand assets</h2><p className="mt-1 text-sm text-muted-foreground">Upload images for this tenant workspace and public website. Changes are visible after saving.</p></section>
    {!canEdit ? <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">You can view the tenant branding, but only an Admin can edit it.</p> : null}
    <div className="grid gap-5 lg:grid-cols-2">{BRANDING_ASSETS.map((config) => {
      const change = changes[config.asset];
      return <BrandingAssetCard key={config.asset} config={config} url={branding?.[BRANDING_FIELDS[config.asset]] ?? null} selectedFile={change instanceof File ? change : undefined} removalPending={change === null} canEdit={canEdit} saving={saving} onSelect={requestReplace} onRemove={(asset) => setPendingAssetAction({ type: "remove", asset })} onSave={(asset) => setConfirmAssets([asset])} />;
    })}</div>
    {canEdit ? <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-xl border border-border bg-card/95 px-5 py-3 backdrop-blur"><p className="text-sm text-muted-foreground">{hasChanges ? "You have unsaved branding changes." : "No unsaved changes."}</p><Button type="button" disabled={!hasChanges || saving} onClick={() => setConfirmAssets(Object.keys(changes) as BrandingAsset[])}>{saving ? "Saving…" : "Save all changes"}</Button></div> : null}
    {message ? <p className="text-sm text-muted-foreground" role="status">{message}</p> : null}
    <BrandingConfirmDialog assets={confirmAssets} saving={saving} onClose={() => setConfirmAssets(null)} onConfirm={() => { if (confirmAssets) void saveChanges(confirmAssets); }} />
    <StageAssetDialog action={pendingAssetAction} onClose={() => setPendingAssetAction(null)} onConfirm={confirmAssetAction} />
  </div>;
}

function BrandingConfirmDialog({ assets, saving, onClose, onConfirm }: { assets: BrandingAsset[] | null; saving: boolean; onClose: () => void; onConfirm: () => void }) {
  return <Dialog open={assets !== null} onOpenChange={(open) => { if (!saving && !open) onClose(); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{assets?.length === 1 ? "Save branding asset?" : "Save all branding changes?"}</DialogTitle><DialogDescription>{assets?.length === 1 ? "The selected upload or removal will be applied to this tenant." : "Your selected images and removals will be applied to this tenant."}</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button type="button" disabled={saving || !assets?.length} onClick={onConfirm}>{saving ? "Saving…" : assets?.length === 1 ? "Save" : "Save all changes"}</Button></DialogFooter></DialogContent></Dialog>;
}

function StageAssetDialog({ action, onClose, onConfirm }: { action: PendingAssetAction | null; onClose: () => void; onConfirm: () => void }) {
  const removing = action?.type === "remove";
  return <Dialog open={action !== null} onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{removing ? "Remove branding image?" : "Replace branding image?"}</DialogTitle><DialogDescription>{removing ? "This image will be marked for removal. Save the asset or save all changes to apply it." : "This image will be staged as a replacement. Save the asset or save all changes to upload it."}</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="button" variant={removing ? "destructive" : "default"} onClick={onConfirm}>{removing ? "Remove image" : "Stage replacement"}</Button></DialogFooter></DialogContent></Dialog>;
}

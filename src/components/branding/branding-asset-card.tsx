"use client";

import type {
  BrandingAsset,
  BrandingAssetConfig,
  PreviewKind,
} from "@/components/branding/branding-types";
import { Button } from "@/components/ui/button";
import { ImageIcon, Share2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useId } from "react";

const assetServer =
  process.env.NEXT_PUBLIC_GRAPHQL_SERVER_URL?.replace(/\/graphql$/, "") ??
  "http://localhost:4000";

function AssetPreview({
  url,
  alt,
  variant,
}: {
  url: string | null;
  alt: string;
  variant: PreviewKind;
}) {
  const imageUrl = url ? `${assetServer}${url}` : null;
  const isSocial = variant === "social";
  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 ${isSocial ? "h-32" : "h-24 p-4"}`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          unoptimized
          loading={isSocial ? "eager" : undefined}
          sizes={isSocial ? "(min-width: 1024px) 40vw, 100vw" : "240px"}
          className={isSocial ? "object-cover" : "p-4 object-contain"}
        />
      ) : (
        <div className="text-center text-xs text-muted-foreground">
          {isSocial ? (
            <Share2 className="mx-auto mb-2 size-5" />
          ) : (
            <ImageIcon className="mx-auto mb-1 size-4" />
          )}
          {isSocial ? "No social image uploaded" : "Default branding"}
        </div>
      )}
    </div>
  );
}

type BrandingAssetCardProps = {
  config: BrandingAssetConfig;
  url: string | null;
  selectedFile?: File;
  removalPending: boolean;
  canEdit: boolean;
  saving: boolean;
  onSelect: (asset: BrandingAsset, file?: File) => void;
  onRemove: (asset: BrandingAsset) => void;
  onSave: (asset: BrandingAsset) => void;
};

export function BrandingAssetCard({
  config,
  url,
  selectedFile,
  removalPending,
  canEdit,
  saving,
  onSelect,
  onRemove,
  onSave,
}: BrandingAssetCardProps) {
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
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
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

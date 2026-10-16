"use client";

import { BrandingAssetCard } from "@/components/branding/branding-asset-card";
import { SEO_IMAGE_ASSET } from "@/components/branding/branding-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { useTenantSeoSettings } from "@/hooks/use-tenant-seo-settings";

type Props = ReturnType<typeof useTenantSeoSettings> & { canUpdate: boolean };
const labelClass = "grid gap-2 text-sm font-medium";
const textAreaClass = "min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50";

export function SeoSettingsPanel({
  values, imageUrl, pendingImage, dirty, loading, error, refetch, saving, message, saveError,
  setField, selectImage, removeImage, save, canUpdate,
}: Props) {
  if (loading) return <p role="status" className="text-sm text-muted-foreground">Loading SEO settings…</p>;
  if (error) return <div className="space-y-3"><p role="alert" className="text-sm text-destructive">Unable to load SEO settings.</p>
    <Button variant="outline" onClick={() => void refetch()}>Retry</Button></div>;

  return <form className="max-w-3xl space-y-5" onSubmit={(event) => { event.preventDefault(); void save(); }}>
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div><h2 className="text-base font-semibold">Search Engine</h2>
        <p className="text-sm text-muted-foreground">Control whether public pages may appear in search results.</p></div>
      <div className="flex items-center justify-between gap-4">
        <span id="indexing-label" className="text-sm font-medium">Allow Search Engine Indexing</span>
        <button type="button" role="switch" aria-labelledby="indexing-label" aria-checked={values.allowIndexing}
          onClick={() => setField("allowIndexing", !values.allowIndexing)} disabled={!canUpdate}
          className={`min-w-16 rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${values.allowIndexing ? "bg-primary" : "bg-slate-500"}`}>
          {values.allowIndexing ? "ON" : "OFF"}
        </button>
      </div>
    </section>
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div><h2 className="text-base font-semibold">Default Metadata</h2>
        <p className="text-sm text-muted-foreground">Fallbacks for pages without more specific metadata. Article titles and summaries take priority.</p></div>
      <label className={labelClass}>Meta Title
        <Input value={values.metaTitle} onChange={(event) => setField("metaTitle", event.target.value)} maxLength={160} disabled={!canUpdate} />
      </label>
      <label className={labelClass}>Meta Description
        <textarea className={textAreaClass} value={values.metaDescription} onChange={(event) => setField("metaDescription", event.target.value)} maxLength={500} disabled={!canUpdate} />
      </label>
    </section>
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div><h2 className="text-base font-semibold">Open Graph</h2>
        <p className="text-sm text-muted-foreground">Default social previews. Empty OG text falls back to the meta title and description.</p></div>
      <label className={labelClass}>OG Title
        <Input value={values.ogTitle} onChange={(event) => setField("ogTitle", event.target.value)} maxLength={160} disabled={!canUpdate} />
      </label>
      <label className={labelClass}>OG Description
        <textarea className={textAreaClass} value={values.ogDescription} onChange={(event) => setField("ogDescription", event.target.value)} maxLength={500} disabled={!canUpdate} />
      </label>
      <div className="space-y-2"><h3 className="text-sm font-medium">Default OG Image</h3>
        <p className="text-xs text-muted-foreground">Uses this tenant’s existing Open Graph branding image when a story has no image.</p>
        <BrandingAssetCard config={SEO_IMAGE_ASSET} url={imageUrl} selectedFile={pendingImage instanceof File ? pendingImage : undefined}
          removalPending={pendingImage === "remove"} canEdit={canUpdate} saving={saving} showSaveButton={false}
          accept="image/png,image/jpeg,image/webp" fileHint="PNG, JPEG, or WebP · Maximum 1,000 KB"
          onSelect={(_asset, file) => selectImage(file)} onRemove={() => removeImage()} onSave={() => {}} />
      </div>
    </section>
    {saveError ? <p role="alert" className="text-sm text-destructive">{saveError}</p> : null}
    {message ? <p role="status" className="text-sm text-primary">{message}</p> : null}
    {!canUpdate ? <p className="text-sm text-muted-foreground">You can view these defaults but cannot change them.</p>
      : <Button type="submit" disabled={!dirty || saving}>{saving ? "Saving…" : "Save changes"}</Button>}
  </form>;
}

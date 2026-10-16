"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { useTenantSocialLinks } from "@/hooks/use-tenant-social-links";
import { SOCIAL_PLATFORMS } from "@/types/social-links.types";

type Props = ReturnType<typeof useTenantSocialLinks> & { canUpdate: boolean };

export function SocialLinksPanel({ rows, dirty, loading, error, refetch, saving, message, saveError, setUrl, setEnabled, save, canUpdate }: Props) {
  if (loading) return <p role="status" className="text-sm text-muted-foreground">Loading social links…</p>;
  if (error) return <div className="space-y-3"><p role="alert" className="text-sm text-destructive">Unable to load social links.</p>
    <Button variant="outline" onClick={() => void refetch()}>Retry</Button></div>;

  return <form className="max-w-3xl space-y-5" onSubmit={(event) => { event.preventDefault(); void save(); }}>
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-5"><h2 className="text-base font-semibold">Social Links</h2>
        <p className="text-sm text-muted-foreground">Add your official profiles. Only enabled links appear on the public website.</p></div>
      <div className="divide-y">
        {SOCIAL_PLATFORMS.map(({ platform, label }) => {
          const row = rows.find((item) => item.platform === platform);
          if (!row) return null;
          return <div key={platform} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[7rem_minmax(0,1fr)_7rem] sm:items-center">
            <label htmlFor={`social-${platform}`} className="text-sm font-medium">{label}</label>
            <Input id={`social-${platform}`} type="url" inputMode="url" placeholder="https://..." value={row.url}
              onChange={(event) => setUrl(platform, event.target.value)} maxLength={2048} disabled={!canUpdate} />
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground sm:justify-end">
              <input type="checkbox" checked={row.enabled} onChange={(event) => setEnabled(platform, event.target.checked)}
                disabled={!canUpdate || !row.url.trim()} className="size-4 accent-primary" />
              Enabled
            </label>
          </div>;
        })}
      </div>
    </section>
    {saveError ? <p role="alert" className="text-sm text-destructive">{saveError}</p> : null}
    {message ? <p role="status" className="text-sm text-primary">{message}</p> : null}
    {!canUpdate ? <p className="text-sm text-muted-foreground">You can view these links but cannot change them.</p>
      : <Button type="submit" disabled={!dirty || saving}>{saving ? "Saving…" : "Save changes"}</Button>}
  </form>;
}

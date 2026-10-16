"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BreakingDurationUnit } from "@/lib/apollo/generated/graphql";
import type { useTenantContentSettings } from "@/hooks/use-tenant-content-settings";

type Props = ReturnType<typeof useTenantContentSettings> & { canUpdate: boolean };

export function ContentSettingsPanel({ value, unit, dirty, loading, error, refetch, saving,
  message, saveError, change, save, canUpdate }: Props) {
  if (loading) return <p role="status" className="text-sm text-muted-foreground">Loading Content settings…</p>;
  if (error) return <div className="space-y-3"><p role="alert" className="text-sm text-destructive">Unable to load Content settings.</p>
    <Button variant="outline" onClick={() => void refetch()}>Retry</Button></div>;
  return <form className="max-w-3xl space-y-5" onSubmit={(event) => { event.preventDefault(); void save(); }}>
    <section className="space-y-5 rounded-xl border bg-card p-5">
      <div><h2 className="text-base font-semibold">Breaking News</h2>
        <p className="text-sm text-muted-foreground">Set how long newly published Breaking articles appear as Breaking news.</p></div>
      <div className="space-y-2">
        <label htmlFor="breaking-duration" className="text-sm font-medium">Default Breaking Duration</label>
        <div className="flex max-w-sm gap-2">
          <Input id="breaking-duration" type="number" min={1} max={unit === "DAYS" ? 30 : 720}
            step={1} value={value} onChange={(event) => change(event.target.value, unit)} disabled={!canUpdate} required />
          <select aria-label="Breaking duration unit" value={unit}
            onChange={(event) => change(value, event.target.value as BreakingDurationUnit)} disabled={!canUpdate}
            className="min-w-28 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
            <option value="HOURS">Hours</option>
            <option value="DAYS">Days</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground">Starts when an article is published. Existing published articles keep their expiration. Maximum 30 days.</p>
      </div>
    </section>
    {saveError ? <p role="alert" className="text-sm text-destructive">{saveError}</p> : null}
    {message ? <p role="status" className="text-sm text-primary">{message}</p> : null}
    {!canUpdate ? <p className="text-sm text-muted-foreground">You can view this default but cannot change it.</p>
      : <Button type="submit" disabled={!dirty || saving}>{saving ? "Saving…" : "Save changes"}</Button>}
  </form>;
}

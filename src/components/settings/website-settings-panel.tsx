"use client";

import { Button } from "@/components/ui/button";
import type { useTenantWebsiteSettings } from "@/hooks/use-tenant-website-settings";

type Props = ReturnType<typeof useTenantWebsiteSettings> & { canUpdate: boolean };

export function WebsiteSettingsPanel({
  values, dirty, loading, error, refetch, saving, message, saveError, setField, save, canUpdate,
}: Props) {
  if (loading) return <p role="status" className="text-sm text-muted-foreground">Loading Website settings…</p>;
  if (error) return <div className="space-y-3"><p role="alert" className="text-sm text-destructive">Unable to load Website settings.</p>
    <Button variant="outline" onClick={() => void refetch()}>Retry</Button></div>;

  return <form className="max-w-3xl space-y-5" onSubmit={(event) => { event.preventDefault(); void save(); }}>
    <section className="space-y-6 rounded-xl border bg-card p-5">
      <div><h2 className="text-base font-semibold">Website</h2>
        <p className="text-sm text-muted-foreground">Control availability of your public website.</p></div>
      <div className="flex items-start justify-between gap-5">
        <div className="space-y-1">
          <span id="maintenance-label" className="text-sm font-medium">Maintenance Mode</span>
          <p id="maintenance-help" className="max-w-xl text-sm text-muted-foreground">
            Temporarily make the public website unavailable to visitors while maintenance is being performed.
          </p>
        </div>
        <button type="button" role="switch" aria-labelledby="maintenance-label" aria-describedby="maintenance-help"
          aria-checked={values.maintenanceMode} onClick={() => setField("maintenanceMode", !values.maintenanceMode)}
          disabled={!canUpdate}
          className={`mt-0.5 min-w-16 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${values.maintenanceMode ? "bg-primary" : "bg-slate-500"}`}>
          {values.maintenanceMode ? "ON" : "OFF"}
        </button>
      </div>
      <label className="grid gap-2 text-sm font-medium">Maintenance Message
        <textarea value={values.maintenanceMessage ?? ""} onChange={(event) => setField("maintenanceMessage", event.target.value || null)}
          maxLength={1000} disabled={!canUpdate} rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50" />
        <span className="text-xs font-normal text-muted-foreground">Optional. The message stays saved when Maintenance Mode is off.</span>
      </label>
    </section>
    {saveError ? <p role="alert" className="text-sm text-destructive">{saveError}</p> : null}
    {message ? <p role="status" className="text-sm text-primary">{message}</p> : null}
    {!canUpdate ? <p className="text-sm text-muted-foreground">You can view these settings but cannot change them.</p>
      : <Button type="submit" disabled={!dirty || saving}>{saving ? "Saving…" : "Save changes"}</Button>}
  </form>;
}

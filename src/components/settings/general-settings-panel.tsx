"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTenantGeneralSettings } from "@/hooks/use-tenant-general-settings";

const fieldClass = "grid gap-2 text-sm font-medium";
const textAreaClass = "min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50";

export function GeneralSettingsPanel() {
  const { permissions, values, dirty, loading, error, refetch, saving, message, saveError, setField, save } =
    useTenantGeneralSettings();

  if (permissions.loading) return <p role="status" className="text-sm text-muted-foreground">Loading settings access…</p>;
  if (!permissions.canViewSettings) return <p className="text-sm text-muted-foreground">You do not have permission to view General settings.</p>;
  if (loading) return <p role="status" className="text-sm text-muted-foreground">Loading General settings…</p>;
  if (error) return <div className="space-y-3"><p role="alert" className="text-sm text-destructive">Unable to load General settings.</p>
    <Button variant="outline" onClick={() => void refetch()}>Retry</Button></div>;

  const readOnly = !permissions.canUpdateSettings;
  return <form className="max-w-3xl space-y-6" onSubmit={(event) => { event.preventDefault(); void save(); }}>
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div><h2 className="text-base font-semibold">General</h2>
        <p className="text-sm text-muted-foreground">Basic details shown to readers and used across your site.</p></div>
      <label className={fieldClass}>Site Name
        <Input value={values.siteName} onChange={(event) => setField("siteName", event.target.value)}
          maxLength={120} required disabled={readOnly} />
      </label>
      <label className={fieldClass}>Site Description
        <textarea className={textAreaClass} value={values.siteDescription}
          onChange={(event) => setField("siteDescription", event.target.value)} maxLength={500} disabled={readOnly} />
      </label>
    </section>
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div><h2 className="text-base font-semibold">Contact Information</h2>
        <p className="text-sm text-muted-foreground">How readers can reach your organization.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={fieldClass}>Email
          <Input type="email" value={values.contactEmail} onChange={(event) => setField("contactEmail", event.target.value)}
            maxLength={254} disabled={readOnly} />
        </label>
        <label className={fieldClass}>Phone
          <Input type="tel" value={values.phone} onChange={(event) => setField("phone", event.target.value)}
            maxLength={30} disabled={readOnly} />
        </label>
        <label className={fieldClass}>Secondary Phone <span className="text-xs font-normal text-muted-foreground">Optional</span>
          <Input type="tel" value={values.secondaryPhone ?? ""}
            onChange={(event) => setField("secondaryPhone", event.target.value || null)} maxLength={30} disabled={readOnly} />
        </label>
      </div>
      <label className={fieldClass}>Address
        <textarea className={textAreaClass} value={values.address}
          onChange={(event) => setField("address", event.target.value)} maxLength={500} disabled={readOnly} />
      </label>
    </section>
    {saveError ? <p role="alert" className="text-sm text-destructive">{saveError}</p> : null}
    {message ? <p role="status" className="text-sm text-primary">{message}</p> : null}
    {readOnly ? <p className="text-sm text-muted-foreground">You can view these settings but cannot change them.</p>
      : <Button type="submit" disabled={!dirty || saving}>{saving ? "Saving…" : "Save changes"}</Button>}
  </form>;
}

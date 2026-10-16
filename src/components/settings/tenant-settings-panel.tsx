"use client";

import { useState } from "react";
import { TenantBrandingPanel } from "@/components/branding/tenant-branding-panel";
import { GeneralSettingsPanel } from "@/components/settings/general-settings-panel";
import { WebsiteSettingsPanel } from "@/components/settings/website-settings-panel";
import { SocialLinksPanel } from "@/components/settings/social-links-panel";
import { SeoSettingsPanel } from "@/components/settings/seo-settings-panel";
import { ContentSettingsPanel } from "@/components/settings/content-settings-panel";
import { useTenantWebsiteSettings } from "@/hooks/use-tenant-website-settings";
import { useTenantSocialLinks } from "@/hooks/use-tenant-social-links";
import { useTenantSeoSettings } from "@/hooks/use-tenant-seo-settings";
import { useTenantContentSettings } from "@/hooks/use-tenant-content-settings";
import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";

const tabs = ["General", "Website", "Social Links", "SEO", "Content"] as const;

export function TenantSettingsPanel() {
  const permissions = useTenantUserPermissions();
  const [selected, setSelected] = useState<(typeof tabs)[number]>("General");
  const active = selected;
  const website = useTenantWebsiteSettings(active === "Website" && permissions.canViewSettings, permissions.canUpdateSettings);
  const social = useTenantSocialLinks(active === "Social Links" && permissions.canViewSettings, permissions.canUpdateSettings);
  const seo = useTenantSeoSettings(active === "SEO" && permissions.canViewSettings, permissions.canUpdateSettings);
  const content = useTenantContentSettings(active === "Content" && permissions.canViewSettings, permissions.canUpdateSettings);

  return <div className="space-y-5">
    <div role="tablist" aria-label="Settings sections" className="flex flex-wrap gap-1 border-b">
      {tabs.map((tab) => {
        return <button key={tab} type="button" role="tab" aria-selected={active === tab}
          disabled={!permissions.canViewSettings} onClick={() => setSelected(tab)}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${active === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"}`}>
          {tab}
        </button>;
      })}
    </div>
    {permissions.loading ? <p role="status" className="text-sm text-muted-foreground">Loading settings access…</p>
      : !permissions.canViewSettings
        ? <p className="text-sm text-muted-foreground">You do not have permission to view Settings.</p>
        : active === "General" ? <GeneralSettingsPanel /> : active === "Social Links" ? <SocialLinksPanel {...social} canUpdate={permissions.canUpdateSettings} /> : active === "SEO" ? <SeoSettingsPanel {...seo} canUpdate={permissions.canUpdateSettings} /> : active === "Content" ? <ContentSettingsPanel {...content} canUpdate={permissions.canUpdateSettings} /> : <div className="space-y-8">
          <WebsiteSettingsPanel {...website} canUpdate={permissions.canUpdateSettings} />
          <TenantBrandingPanel />
        </div>}
  </div>;
}

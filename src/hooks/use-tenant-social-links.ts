"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import type { SaveSocialLinkInput, SocialPlatform } from "@/lib/apollo/generated/graphql";
import { MY_SOCIAL_LINKS_QUERY, UPDATE_MY_SOCIAL_LINKS } from "@/lib/apollo/operations";
import { SOCIAL_PLATFORMS } from "@/types/social-links.types";

function formRows(saved: readonly SaveSocialLinkInput[] = []): SaveSocialLinkInput[] {
  return SOCIAL_PLATFORMS.map(({ platform }, index) => {
    const link = saved.find((item) => item.platform === platform);
    return { platform, url: link?.url ?? "", enabled: link?.enabled ?? false, sortOrder: link?.sortOrder ?? index };
  });
}

export function useTenantSocialLinks(canView: boolean, canUpdate: boolean) {
  const query = useQuery(MY_SOCIAL_LINKS_QUERY, { skip: !canView, fetchPolicy: "cache-and-network" });
  const [update, mutation] = useMutation(UPDATE_MY_SOCIAL_LINKS);
  const [draft, setDraft] = useState<SaveSocialLinkInput[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const rows = draft ?? formRows(query.data?.mySocialLinks);

  function change(platform: SocialPlatform, patch: Partial<Pick<SaveSocialLinkInput, "url" | "enabled">>) {
    setDraft(rows.map((row) => row.platform === platform ? { ...row, ...patch } : row));
    setMessage(null);
    setSaveError(null);
  }

  function setUrl(platform: SocialPlatform, url: string) {
    const row = rows.find((item) => item.platform === platform);
    change(platform, { url, enabled: url.trim() ? (row?.url ? row.enabled : true) : false });
  }

  function setEnabled(platform: SocialPlatform, enabled: boolean) {
    change(platform, { enabled });
  }

  async function save() {
    if (!canUpdate || !draft) return;
    setSaveError(null);
    setMessage(null);
    try {
      await update({ variables: { input: draft } });
      await query.refetch();
      setDraft(null);
      setMessage("Social links saved.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save social links.");
    }
  }

  return {
    rows, dirty: draft !== null, loading: query.loading && !query.data, error: query.error,
    refetch: query.refetch, saving: mutation.loading, message, saveError, setUrl, setEnabled, save,
  };
}

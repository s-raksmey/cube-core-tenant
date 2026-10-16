"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import type { UpdateWebsiteSettingsInput } from "@/lib/apollo/generated/graphql";
import { MY_WEBSITE_SETTINGS_QUERY, UPDATE_MY_WEBSITE_SETTINGS } from "@/lib/apollo/operations";
import { websiteSettingsInput } from "@/lib/settings-inputs";

const defaults: UpdateWebsiteSettingsInput = { maintenanceMode: false, maintenanceMessage: null };

export function useTenantWebsiteSettings(canView: boolean, canUpdate: boolean) {
  const query = useQuery(MY_WEBSITE_SETTINGS_QUERY, { skip: !canView, fetchPolicy: "cache-and-network" });
  const [update, mutation] = useMutation(UPDATE_MY_WEBSITE_SETTINGS);
  const [draft, setDraft] = useState<UpdateWebsiteSettingsInput | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const values = draft ?? (query.data?.myWebsiteSettings
    ? websiteSettingsInput(query.data.myWebsiteSettings) : defaults);

  function setField<K extends keyof UpdateWebsiteSettingsInput>(key: K, value: UpdateWebsiteSettingsInput[K]) {
    setDraft({ ...values, [key]: value });
    setMessage(null);
    setSaveError(null);
  }

  async function save() {
    if (!canUpdate || !draft) return;
    setSaveError(null);
    setMessage(null);
    try {
      await update({ variables: { input: draft } });
      await query.refetch();
      setDraft(null);
      setMessage("Website settings saved.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save Website settings.");
    }
  }

  return {
    values,
    dirty: draft !== null,
    loading: query.loading && !query.data,
    error: query.error,
    refetch: query.refetch,
    saving: mutation.loading,
    message,
    saveError,
    setField,
    save,
  };
}

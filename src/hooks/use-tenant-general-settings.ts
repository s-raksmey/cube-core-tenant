"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";
import {
  MY_GENERAL_SETTINGS_QUERY,
  UPDATE_MY_GENERAL_SETTINGS,
} from "@/lib/apollo/operations";
import type { UpdateGeneralSettingsInput } from "@/lib/apollo/generated/graphql";
import { generalSettingsInput } from "@/lib/settings-inputs";

const empty: UpdateGeneralSettingsInput = {
  siteName: "",
  siteDescription: "",
  contactEmail: "",
  phone: "",
  secondaryPhone: null,
  address: "",
};

export function useTenantGeneralSettings() {
  const permissions = useTenantUserPermissions();
  const query = useQuery(MY_GENERAL_SETTINGS_QUERY, {
    skip: !permissions.canViewSettings,
    fetchPolicy: "cache-and-network",
  });
  const [update, mutation] = useMutation(UPDATE_MY_GENERAL_SETTINGS);
  const [draft, setDraft] = useState<UpdateGeneralSettingsInput | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const values = draft ?? (query.data?.myGeneralSettings
    ? generalSettingsInput(query.data.myGeneralSettings) : empty);

  function setField<K extends keyof UpdateGeneralSettingsInput>(key: K, value: UpdateGeneralSettingsInput[K]) {
    setDraft({ ...values, [key]: value });
    setMessage(null);
    setSaveError(null);
  }

  async function save() {
    if (!permissions.canUpdateSettings || !draft) return;
    setSaveError(null);
    setMessage(null);
    try {
      await update({ variables: { input: draft } });
      await query.refetch();
      setDraft(null);
      setMessage("General settings saved.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save General settings.");
    }
  }

  return {
    permissions,
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

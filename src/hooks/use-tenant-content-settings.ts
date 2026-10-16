"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import type { BreakingDurationUnit } from "@/lib/apollo/generated/graphql";
import { MY_CONTENT_SETTINGS_QUERY, UPDATE_MY_CONTENT_SETTINGS } from "@/lib/apollo/operations";

export function useTenantContentSettings(canView: boolean, canUpdate: boolean) {
  const query = useQuery(MY_CONTENT_SETTINGS_QUERY, { skip: !canView, fetchPolicy: "cache-and-network" });
  const [update, mutation] = useMutation(UPDATE_MY_CONTENT_SETTINGS);
  const [draft, setDraft] = useState<{ value: string; unit: BreakingDurationUnit } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const current = query.data?.myContentSettings;
  const value = draft?.value ?? String(current?.breakingDurationValue ?? 24);
  const unit = draft?.unit ?? current?.breakingDurationUnit ?? "HOURS";

  function change(value: string, unit: BreakingDurationUnit) {
    setDraft({ value, unit });
    setMessage(null);
    setSaveError(null);
  }

  async function save() {
    if (!canUpdate || !draft) return;
    const amount = Number(draft.value);
    if (!Number.isInteger(amount) || amount <= 0 || amount > (draft.unit === "DAYS" ? 30 : 720)) {
      setSaveError("Enter a duration greater than zero and no longer than 30 days.");
      return;
    }
    setSaveError(null);
    setMessage(null);
    try {
      await update({ variables: { input: { breakingDurationValue: amount, breakingDurationUnit: draft.unit } } });
      await query.refetch();
      setDraft(null);
      setMessage("Content settings saved.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save Content settings.");
    }
  }

  return { value, unit, dirty: !!draft, loading: query.loading && !query.data, error: query.error,
    refetch: query.refetch, saving: mutation.loading, message, saveError, change, save };
}

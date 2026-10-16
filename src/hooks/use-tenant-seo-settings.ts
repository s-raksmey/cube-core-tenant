"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import type { UpdateSeoSettingsInput } from "@/lib/apollo/generated/graphql";
import { MY_SEO_SETTINGS_QUERY, UPDATE_MY_SEO_IMAGE, UPDATE_MY_SEO_SETTINGS } from "@/lib/apollo/operations";

const defaults: UpdateSeoSettingsInput = {
  allowIndexing: true, metaTitle: "", metaDescription: "", ogTitle: "", ogDescription: "",
};
const imageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useTenantSeoSettings(canView: boolean, canUpdate: boolean) {
  const query = useQuery(MY_SEO_SETTINGS_QUERY, { skip: !canView, fetchPolicy: "cache-and-network" });
  const [updateSettings, settingsMutation] = useMutation(UPDATE_MY_SEO_SETTINGS);
  const [updateImage, imageMutation] = useMutation(UPDATE_MY_SEO_IMAGE);
  const [draft, setDraft] = useState<UpdateSeoSettingsInput | null>(null);
  const [pendingImage, setPendingImage] = useState<File | "remove" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const current = query.data?.mySeoSettings;
  const values = draft ?? (current ? {
    allowIndexing: current.allowIndexing, metaTitle: current.metaTitle, metaDescription: current.metaDescription,
    ogTitle: current.ogTitle, ogDescription: current.ogDescription,
  } : defaults);

  function setField<K extends keyof UpdateSeoSettingsInput>(key: K, value: UpdateSeoSettingsInput[K]) {
    setDraft({ ...values, [key]: value });
    setMessage(null);
    setSaveError(null);
  }

  function selectImage(file?: File) {
    if (!file) return;
    if (!imageTypes.has(file.type) || file.size > 1000 * 1024 || file.size === 0) {
      setSaveError("Choose a PNG, JPEG, or WebP image of 1,000 KB or less.");
      return;
    }
    setPendingImage(file);
    setMessage(null);
    setSaveError(null);
  }

  function removeImage() {
    setPendingImage(current?.defaultOgImageUrl ? "remove" : null);
    setMessage(null);
    setSaveError(null);
  }

  async function save() {
    if (!canUpdate || (!draft && !pendingImage)) return;
    setSaveError(null);
    setMessage(null);
    try {
      if (draft) {
        await updateSettings({ variables: { input: draft } });
        setDraft(null);
      }
      if (pendingImage) {
        await updateImage({ variables: { input: pendingImage === "remove"
          ? { fileName: "remove", mimeType: "image/png", contentBase64: null }
          : { fileName: pendingImage.name, mimeType: pendingImage.type, contentBase64: await fileToBase64(pendingImage) } } });
        setPendingImage(null);
      }
      await query.refetch();
      setMessage("SEO defaults saved.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save SEO defaults.");
    }
  }

  return {
    values, imageUrl: current?.defaultOgImageUrl ?? null, pendingImage,
    dirty: draft !== null || pendingImage !== null,
    loading: query.loading && !query.data, error: query.error, refetch: query.refetch,
    saving: settingsMutation.loading || imageMutation.loading, message, saveError,
    setField, selectImage, removeImage, save,
  };
}

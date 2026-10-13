"use client";

import { tenantDocumentTitleStorageKey } from "@/lib/tenant-document-title";
import { useEffect } from "react";

/** Keeps the authenticated tenant name in browser chrome during route transitions. */
export function TenantDocumentTitleGuard() {
  useEffect(() => {
    const applyStoredTitle = () => {
      try {
        const tenantName = localStorage.getItem(tenantDocumentTitleStorageKey);
        if (tenantName && document.title !== tenantName) {
          document.title = tenantName;
        }
      } catch {
        // Browser storage can be unavailable in privacy-restricted contexts.
      }
    };

    const observer = new MutationObserver(applyStoredTitle);
    observer.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    applyStoredTitle();
    return () => observer.disconnect();
  }, []);

  return null;
}

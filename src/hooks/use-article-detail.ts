"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { ARTICLE_QUERY, SUBMIT_ARTICLE_FOR_REVIEW, REQUEST_ARTICLE_CHANGES, PUBLISH_ARTICLE,
  SCHEDULE_ARTICLE, UPDATE_ARTICLE_SCHEDULE, CANCEL_ARTICLE_SCHEDULE, ARCHIVE_ARTICLE,
  RESTORE_ARTICLE, SET_ARTICLE_BREAKING, SET_ARTICLE_FEATURED } from "@/lib/apollo/operations";
import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";

export type ArticleDetailAction = "submit" | "requestChanges" | "publish" | "schedule" |
  "reschedule" | "cancelSchedule" | "archive" | "restore" | "breaking" | "featured";

export function useArticleDetail(id: string) {
  const permissions = useTenantUserPermissions();
  const query = useQuery(ARTICLE_QUERY, { variables: { id }, skip: !permissions.canViewArticles, fetchPolicy: "network-only" });
  const [submit] = useMutation(SUBMIT_ARTICLE_FOR_REVIEW);
  const [changes] = useMutation(REQUEST_ARTICLE_CHANGES);
  const [publish] = useMutation(PUBLISH_ARTICLE);
  const [schedule] = useMutation(SCHEDULE_ARTICLE);
  const [reschedule] = useMutation(UPDATE_ARTICLE_SCHEDULE);
  const [cancel] = useMutation(CANCEL_ARTICLE_SCHEDULE);
  const [archive] = useMutation(ARCHIVE_ARTICLE);
  const [restore] = useMutation(RESTORE_ARTICLE);
  const [breaking] = useMutation(SET_ARTICLE_BREAKING);
  const [featured] = useMutation(SET_ARTICLE_FEATURED);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  async function act(action: ArticleDetailAction, value?: string | boolean) {
    if (busy) return false;
    setBusy(true); setError(""); setFeedback("");
    try {
      switch (action) {
        case "submit": await submit({ variables: { id } }); break;
        case "requestChanges": await changes({ variables: { id, comment: String(value ?? "") } }); break;
        case "publish": await publish({ variables: { id } }); break;
        case "schedule": await schedule({ variables: { id, scheduledAt: `${value}Z` } }); break;
        case "reschedule": await reschedule({ variables: { id, scheduledAt: `${value}Z` } }); break;
        case "cancelSchedule": await cancel({ variables: { id } }); break;
        case "archive": await archive({ variables: { id } }); break;
        case "restore": await restore({ variables: { id } }); break;
        case "breaking": await breaking({ variables: { id, enabled: Boolean(value) } }); break;
        case "featured": await featured({ variables: { id, enabled: Boolean(value) } }); break;
      }
      await query.refetch();
      setFeedback("Article updated");
      return true;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update article"); return false; }
    finally { setBusy(false); }
  }
  return { article: query.data?.article, permissions, busy, error, feedback, act,
    loading: permissions.loading || query.loading, loadError: query.error };
}

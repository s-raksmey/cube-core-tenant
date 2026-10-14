"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { ARTICLES_QUERY, CATEGORIES_QUERY, DELETE_ARTICLE } from "@/lib/apollo/operations";
import type { ArticleScope, ArticleStatus } from "@/lib/apollo/generated/graphql";
import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";

export function useTenantArticles(initialScope: ArticleScope = "ALL") {
  const permissions = useTenantUserPermissions();
  const [scope, setScope] = useState<ArticleScope>(initialScope);
  const effectiveScope = scope === "REVIEW" && !permissions.canReviewArticles ? "ALL" : scope;
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ArticleStatus | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState("");
  const query = useQuery(ARTICLES_QUERY, {
    variables: { search: search || null, status: status || null, categoryId: categoryId || null, scope: effectiveScope, page, pageSize: 25 },
    skip: !permissions.canViewArticles,
    fetchPolicy: "network-only",
  });
  const categoriesQuery = useQuery(CATEGORIES_QUERY, { variables: { search: null }, skip: !permissions.canViewCategories });
  const [runDelete, deleteState] = useMutation(DELETE_ARTICLE);
  const pageData = query.data?.articles;
  const totalPages = Math.max(1, Math.ceil((pageData?.total ?? 0) / 25));
  const categories = useMemo(() => categoriesQuery.data?.categories ?? [], [categoriesQuery.data]);
  async function deleteDraft(id: string) {
    setActionError(""); setFeedback("");
    try {
      await runDelete({ variables: { id } });
      setFeedback("Draft deleted");
      await query.refetch();
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not delete draft");
      return false;
    }
  }
  return {
    permissions, items: pageData?.items ?? [], total: pageData?.total ?? 0, page, totalPages,
    categories, scope: effectiveScope, status, categoryId, searchInput, search, feedback, actionError,
    loading: permissions.loading || (query.loading && !query.data), refreshing: query.loading,
    error: query.error, deleting: deleteState.loading,
    setSearchInput, applySearch: () => { setSearch(searchInput.trim()); setPage(1); },
    setScope: (value: ArticleScope) => { setScope(value); setPage(1); },
    setStatus: (value: ArticleStatus | "") => { setStatus(value); setPage(1); },
    setCategoryId: (value: string) => { setCategoryId(value); setPage(1); },
    setPage, deleteDraft,
  };
}

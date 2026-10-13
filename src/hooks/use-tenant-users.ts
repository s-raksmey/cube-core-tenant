"use client";

import { TENANT_USERS_QUERY } from "@/lib/apollo/operations";
import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import type { TenantUserRow } from "@/types/tenant-user.types";

const PAGE_SIZE = 10;

/** Owns tenant-user list querying, explicit search, and pagination. */
export function useTenantUsers({ canViewUsers }: { canViewUsers: boolean }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useQuery(TENANT_USERS_QUERY, {
    variables: { search: search || null, page, pageSize: PAGE_SIZE },
    skip: !canViewUsers,
  });
  const pageData = data?.tenantUsers;
  const users = (pageData?.items ?? []) as TenantUserRow[];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const emptyDescription = useMemo(
    () =>
      search
        ? "No users match your search."
        : "Create the first Admin or Editor for this tenant.",
    [search],
  );

  function applySearch() {
    const nextSearch = searchInput.trim();
    if (nextSearch === search && page === 1) return;
    setPage(1);
    setSearch(nextSearch);
  }

  return {
    searchInput,
    setSearchInput,
    search,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    users,
    total,
    totalPages,
    emptyDescription,
    initialLoading: loading && !pageData,
    blockingError: Boolean(error && !pageData),
    refreshError: Boolean(error && pageData),
    refetch,
    applySearch,
  };
}

export type TenantUsersList = ReturnType<typeof useTenantUsers>;
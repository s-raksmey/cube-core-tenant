"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { CategoryOptionsDocument, SubcategoriesDocument } from "@/lib/apollo/generated/graphql";

/** Bounded backend reads for category filters and article organization fields. */
export function useTaxonomyPicker(kind: "category" | "subcategory", enabled: boolean, categoryId?: string) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ categoryId, page: 1 });
  const page = pagination.categoryId === categoryId ? pagination.page : 1;
  const variables = { search: search || null, page, pageSize: 25 };
  const categories = useQuery(CategoryOptionsDocument, {
    variables, skip: !enabled || kind !== "category", fetchPolicy: "network-only",
  });
  const subcategories = useQuery(SubcategoriesDocument, {
    variables: { ...variables, categoryId }, skip: !enabled || kind !== "subcategory" || !categoryId,
    fetchPolicy: "network-only",
  });
  const query = kind === "category" ? categories : subcategories;
  const total = kind === "category" ? categories.data?.categories.total : subcategories.data?.subcategories.total;
  const options = kind === "category"
    ? (categories.data?.categories.items ?? []).map((item) => ({ id: item.id, label: item.name }))
    : (subcategories.data?.subcategories.items ?? []).map((item) => ({ id: item.id, label: item.translations.find((translation) => translation.locale === "en")?.name ?? item.slug }));
  function setPage(value: number) { setPagination({ categoryId, page: value }); }
  return {
    options, page, setPage, totalPages: Math.max(1, Math.ceil((total ?? 0) / 25)),
    searchInput, setSearchInput,
    applySearch: () => {
      const nextSearch = searchInput.trim();
      if (nextSearch === search && page === 1) {
        void query.refetch().catch(() => undefined);
        return;
      }
      setSearch(nextSearch);
      setPage(1);
    },
    loading: query.loading, error: query.error,
  };
}

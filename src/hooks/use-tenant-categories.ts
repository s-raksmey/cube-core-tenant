"use client";

import {
  CATEGORIES_QUERY,
  CREATE_CATEGORY,
  CREATE_SUBCATEGORY,
  DELETE_CATEGORY,
} from "@/lib/apollo/operations";
import type {
  CreateCategoryInput,
  CreateSubcategoryInput,
} from "@/lib/apollo/generated/graphql";
import type { TenantCategory } from "@/types/category.types";
import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";

/** Owns tenant category search, mutations, and list refreshes. */
export function useTenantCategories() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const query = useQuery(CATEGORIES_QUERY, {
    variables: { search: search || null },
  });
  const [runCreateCategory, createCategoryState] = useMutation(CREATE_CATEGORY);
  const [runCreateSubcategory, createSubcategoryState] = useMutation(
    CREATE_SUBCATEGORY,
  );
  const [runDeleteCategory, deleteCategoryState] = useMutation(DELETE_CATEGORY);

  const categories = useMemo(
    () => (query.data?.categories ?? []) as TenantCategory[],
    [query.data?.categories],
  );

  const applySearch = useCallback(() => {
    setSearch(searchInput.trim());
  }, [searchInput]);

  const refresh = useCallback(
    async () => query.refetch({ search: search || null }),
    [query, search],
  );

  const createCategory = useCallback(
    async (input: CreateCategoryInput) => {
      await runCreateCategory({ variables: { input } });
      await refresh();
    },
    [refresh, runCreateCategory],
  );

  const createSubcategory = useCallback(
    async (input: CreateSubcategoryInput) => {
      await runCreateSubcategory({ variables: { input } });
      await refresh();
    },
    [refresh, runCreateSubcategory],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await runDeleteCategory({ variables: { id } });
      await refresh();
    },
    [refresh, runDeleteCategory],
  );

  return {
    searchInput,
    setSearchInput,
    applySearch,
    categories,
    initialLoading: query.loading && !query.data,
    error: query.error,
    createCategory,
    createSubcategory,
    deleteCategory,
    creatingCategory: createCategoryState.loading,
    creatingSubcategory: createSubcategoryState.loading,
    deletingCategory: deleteCategoryState.loading,
    createCategoryError: createCategoryState.error,
    createSubcategoryError: createSubcategoryState.error,
  };
}

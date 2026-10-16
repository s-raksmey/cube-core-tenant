"use client";

import type {
  CreateCategoryInput,
  CreateSubcategoryInput,
  UpdateCategoryInput,
  UpdateSubcategoryInput,
} from "@/lib/apollo/generated/graphql";
import {
  CATEGORIES_QUERY,
  CREATE_CATEGORY,
  CREATE_SUBCATEGORY,
  DELETE_CATEGORY,
  DELETE_SUBCATEGORY,
  UPDATE_CATEGORY,
  UPDATE_SUBCATEGORY,
} from "@/lib/apollo/operations";
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
  const [runCreateSubcategory, createSubcategoryState] =
    useMutation(CREATE_SUBCATEGORY);
  const [runUpdateCategory, updateCategoryState] = useMutation(UPDATE_CATEGORY);
  const [runDeleteCategory, deleteCategoryState] = useMutation(DELETE_CATEGORY);
  const [runUpdateSubcategory, updateSubcategoryState] = useMutation(UPDATE_SUBCATEGORY);
  const [runDeleteSubcategory, deleteSubcategoryState] = useMutation(DELETE_SUBCATEGORY);

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

  const updateCategory = useCallback(
    async (id: string, input: UpdateCategoryInput) => {
      await runUpdateCategory({ variables: { id, input } });
      await refresh();
    },
    [refresh, runUpdateCategory],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await runDeleteCategory({ variables: { id } });
      await refresh();
    },
    [refresh, runDeleteCategory],
  );

  const updateSubcategory = useCallback(
    async (id: string, input: UpdateSubcategoryInput) => {
      await runUpdateSubcategory({ variables: { id, input } });
      await refresh();
    },
    [refresh, runUpdateSubcategory],
  );

  const deleteSubcategory = useCallback(
    async (id: string) => {
      await runDeleteSubcategory({ variables: { id } });
      await refresh();
    },
    [refresh, runDeleteSubcategory],
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
    updateCategory,
    deleteCategory,
    updateSubcategory,
    deleteSubcategory,
    creatingCategory: createCategoryState.loading,
    creatingSubcategory: createSubcategoryState.loading,
    updatingCategory: updateCategoryState.loading,
    deletingCategory: deleteCategoryState.loading,
    updatingSubcategory: updateSubcategoryState.loading,
    deletingSubcategory: deleteSubcategoryState.loading,
    createCategoryError: createCategoryState.error,
    createSubcategoryError: createSubcategoryState.error,
    updateSubcategoryError: updateSubcategoryState.error,
    deleteSubcategoryError: deleteSubcategoryState.error,
  };
}

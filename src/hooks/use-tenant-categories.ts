"use client";

import { useTaxonomyPicker } from "@/hooks/use-taxonomy-picker";

import type {
  CreateCategoryInput,
  CreateSubcategoryInput,
  UpdateCategoryInput,
  UpdateSubcategoryInput,
} from "@/lib/apollo/generated/graphql";
import {
  CATEGORIES_QUERY,
  SUBCATEGORIES_QUERY,
  CREATE_CATEGORY,
  CREATE_SUBCATEGORY,
  DELETE_CATEGORY,
  DELETE_SUBCATEGORY,
  UPDATE_CATEGORY,
  UPDATE_SUBCATEGORY,
} from "@/lib/apollo/operations";
import { useTenantUserPermissions } from "@/hooks/use-tenant-user-permissions";
import type { TenantCategory } from "@/types/category.types";
import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";

/** Owns tenant category search, mutations, and list refreshes. */
export function useTenantCategories() {
  const permissions = useTenantUserPermissions();
  const categoryPicker = useTaxonomyPicker("category", permissions.canViewCategories);
  const [subcategoryInput, setSubcategoryInput] = useState("");
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [subcategoryPage, setSubcategoryPage] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const subcategoryQuery = useQuery(SUBCATEGORIES_QUERY, {
    variables: { search: subcategorySearch || null, categoryId: categoryId || null, page: subcategoryPage, pageSize: 25 },
    skip: !permissions.canViewSubcategories,
    fetchPolicy: "network-only",
  });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery(CATEGORIES_QUERY, {
    variables: { search: search || null, page, pageSize: 25 },
    fetchPolicy: "network-only",
    skip: !permissions.canViewCategories,
  });
  const [runCreateCategory, createCategoryState] = useMutation(CREATE_CATEGORY);
  const [runCreateSubcategory, createSubcategoryState] =
    useMutation(CREATE_SUBCATEGORY);
  const [runUpdateCategory, updateCategoryState] = useMutation(UPDATE_CATEGORY);
  const [runDeleteCategory, deleteCategoryState] = useMutation(DELETE_CATEGORY);
  const [runUpdateSubcategory, updateSubcategoryState] = useMutation(UPDATE_SUBCATEGORY);
  const [runDeleteSubcategory, deleteSubcategoryState] = useMutation(DELETE_SUBCATEGORY);

  const categories = useMemo(
    () => (query.data?.categories.items ?? []) as TenantCategory[],
    [query.data?.categories],
  );

  const applySearch = useCallback(() => {
    const nextSearch = searchInput.trim();
    if (nextSearch === search && page === 1) {
      void query.refetch().catch(() => undefined);
      return;
    }
    setSearch(nextSearch);
    setPage(1);
  }, [searchInput, search, page, query]);

  const refresh = useCallback(
    async () => {
      await query.refetch();
      if (permissions.canViewSubcategories) await subcategoryQuery.refetch();
    },
    [query, permissions.canViewSubcategories, subcategoryQuery],
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
    subcategoryInput, setSubcategoryInput, subcategoryPage, setSubcategoryPage,
    categoryId, categoryPicker,
    setCategoryId: (value: string) => { setCategoryId(value); setSubcategoryPage(1); },
    applySubcategorySearch: () => {
      const nextSearch = subcategoryInput.trim();
      if (nextSearch === subcategorySearch && subcategoryPage === 1) {
        void subcategoryQuery.refetch().catch(() => undefined);
        return;
      }
      setSubcategorySearch(nextSearch);
      setSubcategoryPage(1);
    },
    subcategories: subcategoryQuery.data?.subcategories.items ?? [],
    subcategoryTotal: subcategoryQuery.data?.subcategories.total ?? 0,
    subcategoryLoading: subcategoryQuery.loading,
    subcategoryError: subcategoryQuery.error,
    page,
    setPage,
    total: query.data?.categories.total ?? 0,
    loading: query.loading,
    totalPages: Math.max(1, Math.ceil((query.data?.categories.total ?? 0) / 25)),
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

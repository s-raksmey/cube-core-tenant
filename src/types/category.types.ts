export type TranslationDraft = {
  locale: string;
  name: string;
};

export type TenantSubcategory = {
  id: string;
  categoryId: string;
  slug: string;
  translations: TranslationDraft[];
};

export type TenantCategory = {
  id: string;
  slug: string;
  name: string;
  translations: TranslationDraft[];
  subcategories: TenantSubcategory[];
};

export type CategoryFormState = {
  slug: string;
  translations: TranslationDraft[];
};

export function categoryToFormState(
  category: TenantCategory,
): CategoryFormState {
  const translations = category.translations.map((translation) => ({
    ...translation,
  }));
  return {
    slug: category.slug,
    translations: translations.some(
      (translation) => translation.locale === "en",
    )
      ? translations
      : [{ locale: "en", name: category.name }, ...translations],
  };
}

export function subcategoryToFormState(subcategory: TenantSubcategory): CategoryFormState {
  const english = subcategory.translations.find((translation) => translation.locale === "en");
  return {
    slug: subcategory.slug,
    translations: [
      { locale: "en", name: english?.name ?? "" },
      ...subcategory.translations.filter((translation) => translation.locale !== "en").map((translation) => ({ ...translation })),
    ],
  };
}

export type CategoryTarget = {
  id: string;
  name: string;
};

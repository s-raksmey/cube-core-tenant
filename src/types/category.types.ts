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

export type CategoryTarget = {
  id: string;
  name: string;
};

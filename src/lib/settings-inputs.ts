import type {
  MyGeneralSettingsQuery,
  MyWebsiteSettingsQuery,
  UpdateGeneralSettingsInput,
  UpdateWebsiteSettingsInput,
} from "@/lib/apollo/generated/graphql";

/** Select GraphQL input fields explicitly; cached query objects may contain __typename. */
export function generalSettingsInput(
  settings: MyGeneralSettingsQuery["myGeneralSettings"],
): UpdateGeneralSettingsInput {
  return {
    siteName: settings.siteName,
    siteDescription: settings.siteDescription,
    contactEmail: settings.contactEmail,
    phone: settings.phone,
    secondaryPhone: settings.secondaryPhone,
    address: settings.address,
  };
}

export function websiteSettingsInput(
  settings: MyWebsiteSettingsQuery["myWebsiteSettings"],
): UpdateWebsiteSettingsInput {
  return {
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
  };
}

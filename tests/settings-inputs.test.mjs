import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generalSettingsInput, websiteSettingsInput } from "../src/lib/settings-inputs.ts";

describe("Settings mutation inputs", () => {
  it("omits Apollo metadata from General settings", () => {
    const input = generalSettingsInput({
      __typename: "GeneralSettings",
      siteName: "Cambo", siteDescription: "News", contactEmail: "hello@example.com",
      phone: "+85512345678", secondaryPhone: null, address: "Phnom Penh",
    });
    assert.deepEqual(Object.keys(input), ["siteName", "siteDescription", "contactEmail", "phone", "secondaryPhone", "address"]);
  });

  it("omits Apollo metadata from Website settings", () => {
    const input = websiteSettingsInput({
      __typename: "WebsiteSettings", maintenanceMode: true, maintenanceMessage: "Back soon",
    });
    assert.deepEqual(input, { maintenanceMode: true, maintenanceMessage: "Back soon" });
  });
});

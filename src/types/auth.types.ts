export type TenantAuthStep = "landing" | "password" | "enroll" | "verify";

export type TenantAuthChallenge = {
  challengeToken: string;
  nextStep: "TOTP_ENROLL" | "TOTP_VERIFY";
  qrCodeDataUrl?: string;
  manualEntryKey?: string;
};

import "server-only";

import {
  CompleteActivationDocument,
  CompleteActivationTotpDocument,
  CompletePasswordResetDocument,
  LoginDocument,
  LogoutDocument,
  RefreshSessionDocument,
  ValidateActivationTokenDocument,
  ValidatePasswordResetTokenDocument,
  VerifyLoginTotpDocument,
  VerifyRecoveryCodeDocument,
  VerifyTotpEnrollmentDocument,
} from "@/lib/apollo/generated/graphql";
import type {
  CompleteActivationMutationVariables,
  CompleteActivationTotpMutationVariables,
  CompletePasswordResetMutationVariables,
  ValidateActivationTokenQueryVariables,
  ValidatePasswordResetTokenQueryVariables,
  VerifyLoginTotpMutationVariables,
  VerifyRecoveryCodeMutationVariables,
  VerifyTotpEnrollmentMutationVariables,
} from "@/lib/apollo/generated/graphql";
import { TENANT_AUDIENCE, type ConsoleAudience } from "@/lib/auth/console";
import { serverGraphql } from "@/lib/auth/graphql";

export async function loginWithPassword(input: {
  email: string;
  password: string;
  audience?: ConsoleAudience;
  tenantHostname?: string;
}) {
  const result = await serverGraphql(
    LoginDocument,
    {
      email: input.email,
      password: input.password,
      audience: input.audience ?? TENANT_AUDIENCE,
      tenantHostname: input.tenantHostname,
    },
    "login",
  );
  if (!result.ok) throw new Error(result.error);
  if (!("challengeToken" in result.payload)) {
    throw new Error("Unexpected login response");
  }

  return {
    status: "CHALLENGE" as const,
    nextStep: result.payload.nextStep,
    challengeToken: result.payload.challengeToken,
    qrCodeDataUrl: result.payload.qrCodeDataUrl ?? undefined,
    manualEntryKey: result.payload.manualEntryKey ?? undefined,
  };
}

export async function verifyLoginTotp(variables: VerifyLoginTotpMutationVariables) {
  const result = await serverGraphql(
    VerifyLoginTotpDocument,
    variables,
    "verifyLoginTotp",
  );
  if (!result.ok) throw new Error(result.error);
  return result.payload;
}

export async function verifyTotpEnrollment(
  variables: VerifyTotpEnrollmentMutationVariables,
) {
  const result = await serverGraphql(
    VerifyTotpEnrollmentDocument,
    variables,
    "verifyTotpEnrollment",
  );
  if (!result.ok) throw new Error(result.error);
  return result.payload;
}

export async function verifyRecoveryCode(variables: VerifyRecoveryCodeMutationVariables) {
  const result = await serverGraphql(
    VerifyRecoveryCodeDocument,
    variables,
    "verifyRecoveryCode",
  );
  if (!result.ok) throw new Error(result.error);
  return result.payload;
}

export async function refreshSession(input: {
  refreshToken: string;
  audience?: ConsoleAudience;
}) {
  const result = await serverGraphql(
    RefreshSessionDocument,
    {
      refreshToken: input.refreshToken,
      audience: input.audience ?? TENANT_AUDIENCE,
    },
    "refreshSession",
  );
  if (!result.ok) throw new Error(result.error);
  return result.payload;
}

export async function logoutSession(accessToken: string) {
  return serverGraphql(LogoutDocument, {}, "logout", { accessToken });
}

export function validateActivationToken(token: string) {
  const variables: ValidateActivationTokenQueryVariables = { token };
  return serverGraphql(
    ValidateActivationTokenDocument,
    variables,
    "validateActivationToken",
  );
}

export function completeActivation(variables: CompleteActivationMutationVariables) {
  return serverGraphql(
    CompleteActivationDocument,
    variables,
    "completeActivation",
  );
}

export function completeActivationTotp(
  variables: CompleteActivationTotpMutationVariables,
) {
  return serverGraphql(
    CompleteActivationTotpDocument,
    variables,
    "completeActivationTotp",
  );
}

export function validatePasswordResetToken(token: string) {
  const variables: ValidatePasswordResetTokenQueryVariables = { token };
  return serverGraphql(
    ValidatePasswordResetTokenDocument,
    variables,
    "validatePasswordResetToken",
  );
}

export function completePasswordReset(
  variables: CompletePasswordResetMutationVariables,
) {
  return serverGraphql(
    CompletePasswordResetDocument,
    variables,
    "completePasswordReset",
  );
}

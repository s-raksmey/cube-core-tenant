"use server";

import { headers } from "next/headers";
import type {
  CompleteActivationMutationVariables,
  CompleteActivationTotpMutationVariables,
  CompletePasswordResetMutationVariables,
  VerifyLoginTotpMutationVariables,
  VerifyRecoveryCodeMutationVariables,
  VerifyTotpEnrollmentMutationVariables,
} from "@/lib/apollo/generated/graphql";
import { TENANT_AUDIENCE } from "@/lib/auth/console";
import {
  clearAuthCookiesOnStore,
  readAccessToken,
  setAuthCookiesOnStore,
} from "@/lib/auth/cookies";
import {
  completeActivation,
  completeActivationTotp,
  completePasswordReset,
  loginWithPassword,
  logoutSession,
  validateActivationToken,
  validatePasswordResetToken,
  verifyLoginTotp,
  verifyRecoveryCode,
  verifyTotpEnrollment,
} from "@/lib/auth/upstream";
import { managementHostFromHeader } from "@/lib/tenant-hostname";

function actionError(error: unknown, fallback = "Authentication request failed") {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function currentTenantHostname() {
  const host = managementHostFromHeader((await headers()).get("host"));
  if (host.kind === "domain") return host.hostname;
  if (host.kind === "local" && process.env.NODE_ENV !== "production") {
    return "localhost";
  }
  throw new Error("This tenant console address is unavailable");
}

export async function loginTenant(input: { email: string; password: string }) {
  try {
    const result = await loginWithPassword({
      ...input,
      tenantHostname: await currentTenantHostname(),
    });
    return { ok: true as const, ...result };
  } catch (error) {
    return { ok: false as const, error: actionError(error, "Login failed") };
  }
}

async function completeTenantLogin(accessToken: string, refreshToken: string) {
  await setAuthCookiesOnStore({
    audience: TENANT_AUDIENCE,
    accessToken,
    refreshToken,
  });
  return { ok: true as const };
}

export async function verifyTenantLoginTotp(
  variables: VerifyLoginTotpMutationVariables,
) {
  try {
    const result = await verifyLoginTotp(variables);
    return completeTenantLogin(result.accessToken, result.refreshToken);
  } catch (error) {
    return { ok: false as const, error: actionError(error, "Verification failed") };
  }
}

export async function verifyTenantTotpEnrollment(
  variables: VerifyTotpEnrollmentMutationVariables,
) {
  try {
    const result = await verifyTotpEnrollment(variables);
    return completeTenantLogin(result.accessToken, result.refreshToken);
  } catch (error) {
    return { ok: false as const, error: actionError(error, "Verification failed") };
  }
}

export async function verifyTenantRecoveryCode(
  variables: VerifyRecoveryCodeMutationVariables,
) {
  try {
    const result = await verifyRecoveryCode(variables);
    return completeTenantLogin(result.accessToken, result.refreshToken);
  } catch (error) {
    return { ok: false as const, error: actionError(error, "Verification failed") };
  }
}

export async function validateTenantActivationToken(token: string) {
  return validateActivationToken(token);
}

export async function completeTenantActivation(
  variables: CompleteActivationMutationVariables,
) {
  return completeActivation(variables);
}

export async function completeTenantActivationTotp(
  variables: CompleteActivationTotpMutationVariables,
) {
  return completeActivationTotp(variables);
}

export async function validateTenantPasswordResetToken(token: string) {
  return validatePasswordResetToken(token);
}

export async function completeTenantPasswordReset(
  variables: CompletePasswordResetMutationVariables,
) {
  return completePasswordReset(variables);
}

export async function clearTenantSession() {
  const accessToken = await readAccessToken(TENANT_AUDIENCE);
  if (accessToken) {
    try {
      await logoutSession(accessToken);
    } catch {
      // Clear the local session even if the upstream session has already ended.
    }
  }
  await clearAuthCookiesOnStore(TENANT_AUDIENCE);
}
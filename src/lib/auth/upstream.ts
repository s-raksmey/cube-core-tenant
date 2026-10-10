import {
  TENANT_AUDIENCE,
  type ConsoleAudience,
} from "@/lib/auth/console";
import { serverGraphql } from "@/lib/auth/graphql";
import type { AuthUser } from "@/lib/types";

const AUTH_USER_FIELDS = `
  id
  email
  username
  fullName
  firstName
  lastName
  type
  role
  status
  tenantId
  tenant {
    id
    name
    slug
    type
    status
  }
`;

type ChallengeResult = {
  login: {
    challengeToken: string;
    nextStep: "TOTP_ENROLL" | "TOTP_VERIFY";
    qrCodeDataUrl?: string | null;
    manualEntryKey?: string | null;
  };
};

type AuthPayloadResult = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export async function loginWithPassword(input: {
  email: string;
  password: string;
  audience?: ConsoleAudience;
}) {
  const result = await serverGraphql<ChallengeResult>(
    `mutation Login($email: String!, $password: String!, $audience: LoginAudience!) {
      login(email: $email, password: $password, audience: $audience) {
        ... on AuthChallenge {
          challengeToken
          nextStep
          qrCodeDataUrl
          manualEntryKey
        }
      }
    }`,
    {
      email: input.email,
      password: input.password,
      audience: input.audience ?? TENANT_AUDIENCE,
    },
  );

  if (!result.ok) {
    throw new Error(result.error);
  }

  return {
    status: "CHALLENGE" as const,
    nextStep: result.data.login.nextStep,
    challengeToken: result.data.login.challengeToken,
    qrCodeDataUrl: result.data.login.qrCodeDataUrl ?? undefined,
    manualEntryKey: result.data.login.manualEntryKey ?? undefined,
  };
}

export async function verifyLoginTotp(input: {
  challengeToken: string;
  code: string;
}) {
  const result = await serverGraphql<{ verifyLoginTotp: AuthPayloadResult }>(
    `mutation VerifyLoginTotp($challengeToken: String!, $code: String!) {
      verifyLoginTotp(challengeToken: $challengeToken, code: $code) {
        accessToken
        refreshToken
        user { ${AUTH_USER_FIELDS} }
      }
    }`,
    input,
  );
  if (!result.ok) throw new Error(result.error);
  return result.data.verifyLoginTotp;
}

export async function verifyTotpEnrollment(input: {
  challengeToken: string;
  code: string;
}) {
  const result = await serverGraphql<{
    verifyTotpEnrollment: AuthPayloadResult;
  }>(
    `mutation VerifyTotpEnrollment($challengeToken: String!, $code: String!) {
      verifyTotpEnrollment(challengeToken: $challengeToken, code: $code) {
        accessToken
        refreshToken
        user { ${AUTH_USER_FIELDS} }
      }
    }`,
    input,
  );
  if (!result.ok) throw new Error(result.error);
  return result.data.verifyTotpEnrollment;
}

export async function verifyRecoveryCode(input: {
  challengeToken: string;
  code: string;
}) {
  const result = await serverGraphql<{ verifyRecoveryCode: AuthPayloadResult }>(
    `mutation VerifyRecoveryCode($challengeToken: String!, $code: String!) {
      verifyRecoveryCode(challengeToken: $challengeToken, code: $code) {
        accessToken
        refreshToken
        user { ${AUTH_USER_FIELDS} }
      }
    }`,
    input,
  );
  if (!result.ok) throw new Error(result.error);
  return result.data.verifyRecoveryCode;
}

export async function refreshSession(input: {
  refreshToken: string;
  audience?: ConsoleAudience;
}) {
  const result = await serverGraphql<{
    refreshSession: { accessToken: string };
  }>(
    `mutation RefreshSession($refreshToken: String!, $audience: LoginAudience!) {
      refreshSession(refreshToken: $refreshToken, audience: $audience) {
        accessToken
      }
    }`,
    {
      refreshToken: input.refreshToken,
      audience: input.audience ?? TENANT_AUDIENCE,
    },
  );
  if (!result.ok) throw new Error(result.error);
  return result.data.refreshSession;
}

export async function logoutSession(accessToken: string) {
  await serverGraphql(
    `mutation Logout { logout }`,
    {},
    { accessToken },
  );
}

export async function validateActivationToken(token: string) {
  const result = await serverGraphql<{
    validateActivationToken: Record<string, unknown>;
  }>(
    `query ValidateActivationToken($token: String!) {
      validateActivationToken(token: $token) {
        valid
        expiresAt
        email
        firstName
        lastName
        needsActivation
      }
    }`,
    { token },
  );
  if (!result.ok) {
    return { ok: false as const, status: result.status, payload: { error: result.error } };
  }
  return {
    ok: true as const,
    status: 200,
    payload: result.data.validateActivationToken,
  };
}

export async function completeActivation(body: Record<string, unknown>) {
  const result = await serverGraphql<{
    completeActivation: Record<string, unknown>;
  }>(
    `mutation CompleteActivation(
      $token: String!
      $username: String!
      $password: String!
      $confirmPassword: String!
    ) {
      completeActivation(
        token: $token
        username: $username
        password: $password
        confirmPassword: $confirmPassword
      ) {
        nextStep
        challengeToken
        qrCodeDataUrl
        manualEntryKey
        email
        username
        activationToken
      }
    }`,
    body,
  );
  if (!result.ok) {
    return { ok: false as const, status: result.status, payload: { error: result.error } };
  }
  return {
    ok: true as const,
    status: 200,
    payload: result.data.completeActivation,
  };
}

export async function completeActivationTotp(body: Record<string, unknown>) {
  const result = await serverGraphql<{
    completeActivationTotp: Record<string, unknown>;
  }>(
    `mutation CompleteActivationTotp(
      $challengeToken: String!
      $code: String!
      $activationToken: String!
    ) {
      completeActivationTotp(
        challengeToken: $challengeToken
        code: $code
        activationToken: $activationToken
      ) {
        success
        recoveryCodes
        user { id email }
      }
    }`,
    body,
  );
  if (!result.ok) {
    return { ok: false as const, status: result.status, payload: { error: result.error } };
  }
  return {
    ok: true as const,
    status: 200,
    payload: result.data.completeActivationTotp,
  };
}

export async function validatePasswordResetToken(token: string) {
  const result = await serverGraphql<{
    validatePasswordResetToken: Record<string, unknown>;
  }>(
    `query ValidatePasswordResetToken($token: String!) {
      validatePasswordResetToken(token: $token) {
        valid
        expiresAt
      }
    }`,
    { token },
  );
  if (!result.ok) {
    return { ok: false as const, status: result.status, payload: { error: result.error } };
  }
  return {
    ok: true as const,
    status: 200,
    payload: result.data.validatePasswordResetToken,
  };
}

export async function completePasswordReset(body: Record<string, unknown>) {
  const result = await serverGraphql<{
    completePasswordReset: Record<string, unknown>;
  }>(
    `mutation CompletePasswordReset(
      $token: String!
      $firstName: String
      $lastName: String
      $fullName: String
      $password: String!
      $confirmPassword: String!
    ) {
      completePasswordReset(
        token: $token
        firstName: $firstName
        lastName: $lastName
        fullName: $fullName
        password: $password
        confirmPassword: $confirmPassword
      ) {
        success
      }
    }`,
    body,
  );
  if (!result.ok) {
    return { ok: false as const, status: result.status, payload: { error: result.error } };
  }
  return {
    ok: true as const,
    status: 200,
    payload: result.data.completePasswordReset,
  };
}

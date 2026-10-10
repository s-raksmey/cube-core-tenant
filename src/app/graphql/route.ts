import { NextResponse } from "next/server";
import { TENANT_AUDIENCE, authServerBaseUrl } from "@/lib/auth/console";
import { isAccessTokenUsable } from "@/lib/auth/access-token";
import {
  applyAuthCookies,
  readAccessToken,
  readRefreshToken,
} from "@/lib/auth/cookies";

async function resolveAccessToken(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  shouldSetCookies: boolean;
}> {
  const refreshToken = (await readRefreshToken(TENANT_AUDIENCE)) ?? null;
  const existing = await readAccessToken(TENANT_AUDIENCE);

  if (existing && isAccessTokenUsable(existing)) {
    return {
      accessToken: existing,
      refreshToken,
      shouldSetCookies: false,
    };
  }

  if (!refreshToken) {
    return { accessToken: null, refreshToken: null, shouldSetCookies: false };
  }

  const refreshResponse = await fetch(`${authServerBaseUrl()}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation RefreshSession($refreshToken: String!, $audience: LoginAudience!) {
        refreshSession(refreshToken: $refreshToken, audience: $audience) {
          accessToken
        }
      }`,
      variables: { refreshToken, audience: TENANT_AUDIENCE },
    }),
    cache: "no-store",
  });

  const json = (await refreshResponse.json()) as {
    data?: { refreshSession?: { accessToken?: string } };
    errors?: unknown[];
  };

  if (!refreshResponse.ok || json.errors?.length) {
    return { accessToken: null, refreshToken, shouldSetCookies: false };
  }

  const accessToken = json.data?.refreshSession?.accessToken ?? null;
  return {
    accessToken,
    refreshToken,
    shouldSetCookies: Boolean(accessToken),
  };
}

export async function POST(request: Request) {
  const body = await request.text();
  const { accessToken, refreshToken, shouldSetCookies } =
    await resolveAccessToken();
  const serverUrl =
    process.env.GRAPHQL_SERVER_URL ?? "http://localhost:4000/graphql";

  const upstream = await fetch(serverUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body,
  });

  const text = await upstream.text();
  const response = new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });

  if (shouldSetCookies && accessToken && refreshToken) {
    applyAuthCookies(response, {
      audience: TENANT_AUDIENCE,
      accessToken,
      refreshToken,
    });
  }

  return response;
}

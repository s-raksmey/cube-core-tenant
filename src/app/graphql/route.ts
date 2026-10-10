import { NextResponse } from "next/server";
import { print } from "graphql";
import { RefreshSessionDocument } from "@/lib/apollo/generated/graphql";
import { TENANT_AUDIENCE, authServerBaseUrl } from "@/lib/auth/console";
import { isAccessTokenUsable } from "@/lib/auth/access-token";
import {
  applyAuthCookies,
  readAccessToken,
  readRefreshToken,
} from "@/lib/auth/cookies";

async function resolveAccessToken(): Promise<{
  accessToken: string | null;
  nextRefreshToken: string | null;
  shouldSetCookies: boolean;
}> {
  const refreshToken = (await readRefreshToken(TENANT_AUDIENCE)) ?? null;
  const existing = await readAccessToken(TENANT_AUDIENCE);

  if (existing && isAccessTokenUsable(existing)) {
    return {
      accessToken: existing,
      nextRefreshToken: refreshToken,
      shouldSetCookies: false,
    };
  }

  if (!refreshToken) {
    return {
      accessToken: null,
      nextRefreshToken: null,
      shouldSetCookies: false,
    };
  }

  const refreshResponse = await fetch(`${authServerBaseUrl()}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: print(RefreshSessionDocument),
      variables: { refreshToken, audience: TENANT_AUDIENCE },
    }),
    cache: "no-store",
  });

  const json = (await refreshResponse.json()) as {
    data?: { refreshSession?: { accessToken?: string; refreshToken?: string } };
    errors?: unknown[];
  };

  if (!refreshResponse.ok || json.errors?.length) {
    return {
      accessToken: null,
      nextRefreshToken: null,
      shouldSetCookies: false,
    };
  }

  const accessToken = json.data?.refreshSession?.accessToken ?? null;
  const nextRefreshToken = json.data?.refreshSession?.refreshToken ?? null;
  return {
    accessToken,
    nextRefreshToken,
    shouldSetCookies: Boolean(accessToken && nextRefreshToken),
  };
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ errors: [{ message: "Cross-origin GraphQL request rejected" }] }, { status: 403 });
  }
  const body = await request.text();
  const { accessToken, nextRefreshToken, shouldSetCookies } =
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

  if (shouldSetCookies && accessToken && nextRefreshToken) {
    applyAuthCookies(response, {
      audience: TENANT_AUDIENCE,
      accessToken,
      refreshToken: nextRefreshToken,
    });
  }

  return response;
}

import { NextResponse } from "next/server";
import { print } from "graphql";
import { RefreshSessionDocument } from "@/lib/apollo/generated/graphql";
import { TENANT_AUDIENCE, authServerBaseUrl } from "@/lib/auth/console";
import { isAccessTokenUsable } from "@/lib/auth/access-token";
import {
  applyAuthCookies,
  clearAuthCookies,
  readAccessToken,
  readRefreshToken,
} from "@/lib/auth/cookies";
import { managementHostFromRequest } from "@/lib/tenant-hostname";

// Branding images are capped at 1,000 KB by the API. GraphQL carries them as
// Base64, which adds roughly one third to the request size.
const MAX_GRAPHQL_BODY_BYTES = 1_500_000;

async function resolveAccessToken(): Promise<{
  accessToken: string | null;
  nextRefreshToken: string | null;
  shouldSetCookies: boolean;
  shouldClearCookies: boolean;
}> {
  const refreshToken = (await readRefreshToken(TENANT_AUDIENCE)) ?? null;
  const existing = await readAccessToken(TENANT_AUDIENCE);

  if (existing && isAccessTokenUsable(existing)) {
    return {
      accessToken: existing,
      nextRefreshToken: refreshToken,
      shouldSetCookies: false,
      shouldClearCookies: false,
    };
  }

  if (!refreshToken) {
    return {
      accessToken: null,
      nextRefreshToken: null,
      shouldSetCookies: false,
      shouldClearCookies: Boolean(existing),
    };
  }

  let refreshResponse: Response;
  try {
    refreshResponse = await fetch(`${authServerBaseUrl()}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cube-auth-action-secret":
          process.env.TENANT_AUTH_ACTION_SECRET ?? "",
      },
      body: JSON.stringify({
        query: print(RefreshSessionDocument),
        variables: { refreshToken, audience: TENANT_AUDIENCE },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return {
      accessToken: null,
      nextRefreshToken: null,
      shouldSetCookies: false,
      shouldClearCookies: false,
    };
  }

  let json: {
    data?: { refreshSession?: { accessToken?: string; refreshToken?: string } };
    errors?: { extensions?: { code?: string } }[];
  };
  try {
    json = (await refreshResponse.json()) as typeof json;
  } catch {
    return {
      accessToken: null,
      nextRefreshToken: null,
      shouldSetCookies: false,
      shouldClearCookies: false,
    };
  }

  if (!refreshResponse.ok || json.errors?.length) {
    const terminalFailure = json.errors?.some(({ extensions }) =>
      ["UNAUTHENTICATED", "FORBIDDEN"].includes(extensions?.code ?? ""),
    );
    return {
      accessToken: null,
      nextRefreshToken: null,
      shouldSetCookies: false,
      shouldClearCookies: Boolean(terminalFailure),
    };
  }

  const accessToken = json.data?.refreshSession?.accessToken ?? null;
  const nextRefreshToken = json.data?.refreshSession?.refreshToken ?? null;
  return {
    accessToken,
    nextRefreshToken,
    shouldSetCookies: Boolean(accessToken && nextRefreshToken),
    shouldClearCookies: false,
  };
}

async function readBodyWithinLimit(request: Request): Promise<string | null> {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_GRAPHQL_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    (origin && origin !== new URL(request.url).origin) ||
    fetchSite === "cross-site"
  ) {
    return NextResponse.json({ errors: [{ message: "Cross-origin GraphQL request rejected" }] }, { status: 403 });
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    return NextResponse.json({ errors: [{ message: "GraphQL requests must use application/json" }] }, { status: 415 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_GRAPHQL_BODY_BYTES) {
    return NextResponse.json({ errors: [{ message: "GraphQL request is too large" }] }, { status: 413 });
  }
  const body = await readBodyWithinLimit(request);
  if (body === null) {
    return NextResponse.json({ errors: [{ message: "GraphQL request is too large" }] }, { status: 413 });
  }

  const { accessToken, nextRefreshToken, shouldSetCookies, shouldClearCookies } =
    await resolveAccessToken();
  const managementHost = managementHostFromRequest(request);
  if (managementHost.kind === "invalid") {
    return NextResponse.json({ errors: [{ message: "Invalid tenant console host" }] }, { status: 400 });
  }
  const serverUrl = `${authServerBaseUrl()}/graphql`;

  let upstream: Response;
  try {
    upstream = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(managementHost.kind === "domain"
          ? { "x-cube-tenant-management-host": managementHost.hostname }
          : {}),
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return NextResponse.json({ errors: [{ message: "GraphQL service unavailable" }] }, { status: 502 });
  }

  const text = await upstream.text();
  const response = new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });

  const sessionRejected = Boolean(accessToken && hasUnauthenticatedError(text));

  if (sessionRejected) {
    clearAuthCookies(response, TENANT_AUDIENCE);
  } else if (shouldSetCookies && accessToken && nextRefreshToken) {
    applyAuthCookies(response, {
      audience: TENANT_AUDIENCE,
      accessToken,
      refreshToken: nextRefreshToken,
    });
  } else if (shouldClearCookies) {
    clearAuthCookies(response, TENANT_AUDIENCE);
  }

  return response;
}

function hasUnauthenticatedError(responseText: string) {
  try {
    const payload = JSON.parse(responseText) as {
      errors?: { extensions?: { code?: string } }[];
    };
    return payload.errors?.some(
      (error) => error.extensions?.code === "UNAUTHENTICATED",
    ) ?? false;
  } catch {
    return false;
  }
}

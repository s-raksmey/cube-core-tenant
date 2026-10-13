import "server-only";

import { authServerBaseUrl } from "@/lib/auth/console";
import type { TypedDocumentNode } from "@apollo/client";
import { print } from "graphql";

type GraphqlResult<TPayload> =
  | { ok: true; status: 200; payload: TPayload }
  | { ok: false; error: string; status: number; payload: { error: string } };

type GraphqlResponse<TData> = {
  data?: TData;
  errors?: { message: string }[];
};

export async function serverGraphql<
  TData extends Record<string, unknown>,
  TVariables extends Record<string, unknown>,
  TField extends keyof TData,
>(
  document: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  field: TField,
  init?: { accessToken?: string },
): Promise<GraphqlResult<TData[TField]>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-cube-auth-action-secret": process.env.TENANT_AUTH_ACTION_SECRET ?? "",
    ...(init?.accessToken
      ? { Authorization: `Bearer ${init.accessToken}` }
      : {}),
  };
  const response = await fetch(`${authServerBaseUrl()}/graphql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: print(document), variables }),
    cache: "no-store",
  });

  let json: GraphqlResponse<TData>;
  try {
    json = (await response.json()) as GraphqlResponse<TData>;
  } catch {
    return {
      ok: false,
      error: "Invalid GraphQL response",
      status: response.status || 502,
      payload: { error: "Invalid GraphQL response" },
    };
  }

  if (!response.ok || json.errors?.length || !json.data) {
    const error = json.errors?.[0]?.message ?? "Request failed";
    return {
      ok: false,
      error,
      status: response.status >= 400 ? response.status : 400,
      payload: { error },
    };
  }

  return { ok: true, status: 200, payload: json.data[field] };
}

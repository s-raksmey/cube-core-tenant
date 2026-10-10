import { authServerBaseUrl } from "@/lib/auth/console";

type GraphqlResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

export async function serverGraphql<T>(
  query: string,
  variables: Record<string, unknown> = {},
  init?: { accessToken?: string },
): Promise<GraphqlResult<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (init?.accessToken) {
    headers.Authorization = `Bearer ${init.accessToken}`;
  }

  const response = await fetch(`${authServerBaseUrl()}/graphql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = (await response.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    return {
      ok: false,
      error: json.errors[0]?.message ?? "Request failed",
      status: response.status >= 400 ? response.status : 400,
    };
  }

  if (!json.data) {
    return { ok: false, error: "Empty GraphQL response", status: 500 };
  }

  return { ok: true, data: json.data };
}

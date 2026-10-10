import { TENANT_AUDIENCE } from "@/lib/auth/console";
import { readAccessToken, readRefreshToken } from "@/lib/auth/cookies";
import { refreshSession } from "@/lib/auth/upstream";

export async function ensureTenantAccessToken(): Promise<string | null> {
  const existing = await readAccessToken(TENANT_AUDIENCE);
  if (existing) return existing;

  const refreshToken = await readRefreshToken(TENANT_AUDIENCE);
  if (!refreshToken) return null;

  try {
    const payload = await refreshSession({ refreshToken });
    return payload.accessToken ?? null;
  } catch {
    return null;
  }
}

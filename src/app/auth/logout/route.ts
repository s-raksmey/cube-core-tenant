import { NextResponse } from "next/server";
import { TENANT_AUDIENCE } from "@/lib/auth/console";
import { clearAuthCookies, readAccessToken } from "@/lib/auth/cookies";
import { logoutSession } from "@/lib/auth/upstream";

export async function POST() {
  const accessToken = await readAccessToken(TENANT_AUDIENCE);
  if (accessToken) {
    try {
      await logoutSession(accessToken);
    } catch {
      // Still clear local cookies if upstream logout fails.
    }
  }

  const res = NextResponse.json({ success: true });
  clearAuthCookies(res, TENANT_AUDIENCE);
  return res;
}

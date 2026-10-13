import { TENANT_AUDIENCE } from "@/lib/auth/console";
import { applyAuthCookies } from "@/lib/auth/cookies";
import { verifyLoginTotp } from "@/lib/auth/upstream";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().min(6).max(12),
});

export async function POST(request: Request) {
  const raw = await request.json();
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid verification code" },
      { status: 400 },
    );
  }

  try {
    const payload = await verifyLoginTotp(parsed.data);
    const res = NextResponse.json({ user: payload.user });
    applyAuthCookies(res, {
      audience: TENANT_AUDIENCE,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
    return res;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 401 },
    );
  }
}

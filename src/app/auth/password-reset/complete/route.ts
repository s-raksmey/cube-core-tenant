import { NextResponse } from "next/server";
import { completePasswordReset } from "@/lib/auth/upstream";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const result = await completePasswordReset(body);
  return NextResponse.json(result.payload, {
    status: result.ok ? 200 : result.status,
  });
}

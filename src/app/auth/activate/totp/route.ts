import { NextResponse } from "next/server";
import { completeActivationTotp } from "@/lib/auth/upstream";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const result = await completeActivationTotp(body);
  return NextResponse.json(result.payload, {
    status: result.ok ? 200 : result.status,
  });
}

import { NextResponse } from "next/server";
import { activationTotpSchema } from "@/lib/auth/request-schemas";
import { completeActivationTotp } from "@/lib/auth/upstream";

export async function POST(request: Request) {
  const parsed = activationTotpSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }
  const result = await completeActivationTotp(parsed.data);
  return NextResponse.json(result.payload, {
    status: result.ok ? 200 : result.status,
  });
}

import { activationCredentialsSchema } from "@/lib/auth/request-schemas";
import { completeActivation } from "@/lib/auth/upstream";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const parsed = activationCredentialsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid activation details" },
      { status: 400 },
    );
  }
  const result = await completeActivation(parsed.data);
  return NextResponse.json(result.payload, {
    status: result.ok ? 200 : result.status,
  });
}

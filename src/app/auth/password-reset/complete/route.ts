import { passwordResetSchema } from "@/lib/auth/request-schemas";
import { completePasswordReset } from "@/lib/auth/upstream";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const parsed = passwordResetSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid password reset details" },
      { status: 400 },
    );
  }
  const result = await completePasswordReset(parsed.data);
  return NextResponse.json(result.payload, {
    status: result.ok ? 200 : result.status,
  });
}

import { NextResponse } from "next/server";
import { validateActivationToken } from "@/lib/auth/upstream";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const result = await validateActivationToken(token);
  return NextResponse.json(result.payload, { status: result.ok ? 200 : result.status });
}

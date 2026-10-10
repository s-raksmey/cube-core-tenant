import { NextResponse } from "next/server";
import { z } from "zod";
import { loginWithPassword } from "@/lib/auth/upstream";

const loginBodySchema = z.object({
  /** Username or email. */
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const raw = await request.json();
  const parsed = loginBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Valid email and password are required" },
      { status: 400 },
    );
  }

  try {
    const payload = await loginWithPassword(parsed.data);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 401 },
    );
  }
}

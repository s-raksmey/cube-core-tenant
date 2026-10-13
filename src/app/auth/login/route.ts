import { loginWithPassword } from "@/lib/auth/upstream";
import { managementHostFromRequest } from "@/lib/tenant-hostname";
import { NextResponse } from "next/server";
import { z } from "zod";

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
    const host = managementHostFromRequest(request);
    if (host.kind === "domain") {
      const payload = await loginWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
        tenantHostname: host.hostname,
      });
      return NextResponse.json(payload);
    }

    const localDevelopment =
      host.kind === "local" && process.env.NODE_ENV !== "production";
    if (!localDevelopment) {
      return NextResponse.json(
        { error: "This tenant console address is unavailable" },
        { status: 404 },
      );
    }
    const payload = await loginWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
      tenantHostname: "localhost",
    });
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 401 },
    );
  }
}

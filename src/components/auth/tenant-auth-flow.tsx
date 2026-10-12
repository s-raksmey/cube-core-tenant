"use client";

import { ArrowRight, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";
import type { AuthUser } from "@/lib/types";

type Step = "landing" | "password" | "enroll" | "verify";

type ChallengeState = {
  challengeToken: string;
  nextStep: "TOTP_ENROLL" | "TOTP_VERIFY";
  qrCodeDataUrl?: string;
  manualEntryKey?: string;
};

function requiresFreshLogin(message: string) {
  return /locked|challenge expired|challenge already used|invalid sign-in challenge|enrollment expired/i.test(
    message,
  );
}

export function TenantAuthFlow({
  tenantName,
  managementLogoUrl,
  initialStep = "landing",
}: {
  tenantName: string;
  managementLogoUrl?: string | null;
  initialStep?: "landing" | "password";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<Step>(initialStep);
  // Next can preserve this client component during a route transition. The
  // URL remains the source of truth for entering the sign-in form.
  const activeStep: Step =
    pathname === "/login" && step === "landing" ? "password" : step;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const autoSubmitRef = useRef(false);

  async function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      const payload = (await response.json()) as {
        challengeToken?: string;
        nextStep?: "TOTP_ENROLL" | "TOTP_VERIFY";
        qrCodeDataUrl?: string;
        manualEntryKey?: string;
        user?: AuthUser;
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? "Invalid username/email or password");
        setLoading(false);
        return;
      }
      if (payload.user) {
        router.replace("/dashboard");
        return;
      }
      if (payload.challengeToken && payload.nextStep) {
        setChallenge({
          challengeToken: payload.challengeToken,
          nextStep: payload.nextStep,
          qrCodeDataUrl: payload.qrCodeDataUrl,
          manualEntryKey: payload.manualEntryKey,
        });
        setCode("");
        autoSubmitRef.current = false;
        setStep(payload.nextStep === "TOTP_ENROLL" ? "enroll" : "verify");
        setLoading(false);
        return;
      }
      setError("Unexpected login response");
      setLoading(false);
    } catch {
      setError("Could not reach the sign-in service");
      setLoading(false);
    }
  }

  async function verifyChallenge(nextCode: string, recovery: boolean) {
    if (!challenge || loading) return;
    setLoading(true);
    setError(null);
    const endpoint = recovery
      ? "/auth/2fa/recovery"
      : activeStep === "enroll"
        ? "/auth/2fa/enrollment/verify"
        : "/auth/2fa/verify";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken: challenge.challengeToken,
          code: nextCode,
        }),
      });
      const payload = (await response.json()) as {
        user?: AuthUser;
        error?: string;
      };
      if (!response.ok) {
        const message = payload.error ?? "Verification failed";
        setError(message);
        setLoading(false);
        autoSubmitRef.current = false;
        setCode("");
        if (requiresFreshLogin(message)) {
          setChallenge(null);
          setUseRecoveryCode(false);
          setStep("password");
        }
        return;
      }
      router.replace("/dashboard");
    } catch {
      setError("Could not verify the code");
      setLoading(false);
      autoSubmitRef.current = false;
      setCode("");
    }
  }

  async function onVerifySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await verifyChallenge(code, useRecoveryCode && activeStep === "verify");
  }

  useEffect(() => {
    if (activeStep !== "verify" && activeStep !== "enroll") return;
    if (useRecoveryCode) return;
    if (code.length !== 6) {
      autoSubmitRef.current = false;
      return;
    }
    if (autoSubmitRef.current || loading || !challenge) return;
    autoSubmitRef.current = true;
    void verifyChallenge(code, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, activeStep, useRecoveryCode, loading, challenge]);

  const logoUrl = managementLogoUrl
    ? `${process.env.NEXT_PUBLIC_GRAPHQL_SERVER_URL?.replace(/\/graphql$/, "") ?? "http://localhost:4000"}${managementLogoUrl}`
    : null;

  useEffect(() => {
    if (activeStep === "landing") router.prefetch("/login");
  }, [router, activeStep]);

  function closeForm() {
    if (loading) return;
    setStep("landing");
    setChallenge(null);
    setCode("");
    setError(null);
    setUseRecoveryCode(false);
    router.push("/");
    autoSubmitRef.current = false;
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-20 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-16 bottom-10 size-80 rounded-full bg-primary/5 blur-3xl" />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center gap-3 px-6 py-5">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`${tenantName} logo`}
            width={240}
            height={80}
            unoptimized
            priority
            className="h-12 w-auto max-w-40 object-contain sm:h-14"
          />
        ) : (
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {tenantName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
          </div>
        )}
        <span className="text-sm font-semibold text-foreground sm:text-base">
          {tenantName}
        </span>
      </header>
      <main className="relative z-10 mx-auto grid min-h-[calc(100svh-5.5rem)] w-full max-w-6xl items-center gap-10 px-6 pb-16 pt-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="w-full max-w-xl">
      {activeStep === "landing" ? (
        <div className="space-y-6">
          <p className="text-sm font-medium text-primary">{tenantName} workspace</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            <span className="block">Create. Manage.</span>
            <span className="block whitespace-nowrap text-primary">Publish with Ease.</span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Secure workspace access for {tenantName} Admin and Editor users.
          </p>
          <Button size="lg" asChild>
            <Link href="/login" prefetch>
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
      <Card className="w-full max-w-md border-border bg-card/95 shadow-sm backdrop-blur">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">
              {`Sign in to ${tenantName}`}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Sub-tenant Admin or Editor sign-in with mandatory
              two-factor authentication.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={closeForm} disabled={loading} aria-label="Close sign-in form">
            <X className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeStep === "password" ? (
            <form className="space-y-4" onSubmit={onPasswordSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Username or email</Label>
                <Input
                  id="email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <PasswordField
                id="password"
                value={password}
                onChange={setPassword}
                disabled={loading}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Continuing…" : "Continue"}
              </Button>
            </form>
          ) : null}

          {activeStep === "enroll" ? (
            <form className="space-y-4" onSubmit={onVerifySubmit}>
              {challenge?.qrCodeDataUrl ? (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={challenge.qrCodeDataUrl}
                    alt="QR code"
                    className="size-44"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Preparing authenticator setup…
                </p>
              )}
              {challenge?.manualEntryKey ? (
                <div className="space-y-1">
                  <Label>Manual setup key</Label>
                  <p className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">
                    {challenge.manualEntryKey}
                  </p>
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="code">6-digit code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    setError(null);
                    autoSubmitRef.current = false;
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  }}
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing you in…" : "Activate 2FA"}
              </Button>
            </form>
          ) : null}

          {activeStep === "verify" ? (
            <form className="space-y-4" onSubmit={onVerifySubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="verify">
                  {useRecoveryCode ? "Recovery code" : "6-digit code"}
                </Label>
                <Input
                  id="verify"
                  inputMode={useRecoveryCode ? "text" : "numeric"}
                  maxLength={useRecoveryCode ? 64 : 6}
                  value={code}
                  onChange={(e) => {
                    setError(null);
                    autoSubmitRef.current = false;
                    setCode(
                      useRecoveryCode
                        ? e.target.value.trim().toUpperCase()
                        : e.target.value.replace(/\D/g, "").slice(0, 6),
                    );
                  }}
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
              <button
                type="button"
                className="text-sm text-primary hover:underline disabled:opacity-50"
                disabled={loading}
                onClick={() => {
                  setUseRecoveryCode((v) => !v);
                  setCode("");
                  setError(null);
                  autoSubmitRef.current = false;
                }}
              >
                {useRecoveryCode
                  ? "Use authenticator code instead"
                  : "Use a recovery code"}
              </button>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing you in…" : "Verify"}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
      )}
        </section>
        <section className="relative mx-auto flex w-full max-w-xl items-center justify-center lg:max-w-none">
          <div className="relative aspect-square w-full max-w-110">
            {logoUrl ? <Image src={logoUrl} alt={`${tenantName} logo`} fill unoptimized priority className="object-contain" sizes="(max-width: 1024px) 75vw, 440px" /> : <div className="flex size-full items-center justify-center rounded-full bg-primary/10 text-7xl font-semibold text-primary">{tenantName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}

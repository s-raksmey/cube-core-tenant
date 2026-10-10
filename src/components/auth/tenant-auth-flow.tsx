"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";
import type { AuthUser } from "@/lib/types";

type Step = "password" | "enroll" | "verify";

type ChallengeState = {
  challengeToken: string;
  nextStep: "TOTP_ENROLL" | "TOTP_VERIFY";
  qrCodeDataUrl?: string;
  manualEntryKey?: string;
};

function goToDashboard() {
  window.location.assign("/dashboard");
}

export function TenantAuthFlow() {
  const [step, setStep] = useState<Step>("password");
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
        body: JSON.stringify({ email: email.trim(), password }),
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
        goToDashboard();
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
      : step === "enroll"
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
        setError(payload.error ?? "Verification failed");
        setLoading(false);
        autoSubmitRef.current = false;
        return;
      }
      goToDashboard();
    } catch {
      setError("Could not verify the code");
      setLoading(false);
      autoSubmitRef.current = false;
    }
  }

  async function onVerifySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await verifyChallenge(code, useRecoveryCode && step === "verify");
  }

  useEffect(() => {
    if (step !== "verify" && step !== "enroll") return;
    if (useRecoveryCode) return;
    if (code.length !== 6) {
      autoSubmitRef.current = false;
      return;
    }
    if (autoSubmitRef.current || loading || !challenge) return;
    autoSubmitRef.current = true;
    void verifyChallenge(code, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step, useRecoveryCode, loading, challenge]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-xl">Cube Core Tenant</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sub-tenant Admin, Editor, or Author sign-in with mandatory
            two-factor authentication.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "password" ? (
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

          {step === "enroll" ? (
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

          {step === "verify" ? (
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
    </div>
  );
}

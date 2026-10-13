"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ActivationCredentialsForm,
  ActivationTotpForm,
} from "@/components/auth/activation-forms";
import {
  ActivationCompleteCard,
  ActivationUnavailableCard,
  RecoveryCodesCard,
} from "@/components/auth/activation-status-cards";

type Step = "credentials" | "totp" | "recovery" | "done";

function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token] = useState(() => searchParams.get("token") ?? "");

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [step, setStep] = useState<Step>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [manualEntryKey, setManualEntryKey] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      window.history.replaceState(window.history.state, "", "/activate");
    }
    async function validate() {
      if (!token) {
        setValidating(false);
        return;
      }
      const response = await fetch(
        `/auth/activate/validate?token=${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      setValidating(false);
      if (!response.ok) {
        setValid(false);
        return;
      }
      const payload = (await response.json()) as {
        valid?: boolean;
        expiresAt?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
      };
      setValid(!!payload.valid);
      setExpiresAt(payload.expiresAt ?? null);
      setEmail(payload.email ?? "");
      setFirstName(payload.firstName ?? "");
      setLastName(payload.lastName ?? "");
    }
    void validate();
  }, [token]);

  async function onCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/auth/activate/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        username,
        password,
        confirmPassword,
      }),
    });
    const payload = (await response.json()) as {
      error?: string;
      challengeToken?: string;
      qrCodeDataUrl?: string;
      manualEntryKey?: string;
    };
    setLoading(false);

    if (!response.ok || !payload.challengeToken) {
      setError(payload.error ?? "Activation failed");
      return;
    }

    setChallengeToken(payload.challengeToken);
    setQrCodeDataUrl(payload.qrCodeDataUrl ?? null);
    setManualEntryKey(payload.manualEntryKey ?? null);
    setCode("");
    setStep("totp");
  }

  async function onTotpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/auth/activate/totp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeToken,
        code,
      }),
    });
    const payload = (await response.json()) as {
      error?: string;
      recoveryCodes?: string[];
    };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Verification failed");
      return;
    }

    setRecoveryCodes(payload.recoveryCodes ?? []);
    setStep("recovery");
  }

  function finishActivation() {
    setStep("done");
    setTimeout(() => router.replace("/login"), 1200);
  }

  if (validating) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Validating activation link…</p>
      </div>
    );
  }

  if (!token || !valid) {
    return <ActivationUnavailableCard />;
  }

  if (step === "done") {
    return <ActivationCompleteCard />;
  }

  if (step === "recovery") {
    return (
      <RecoveryCodesCard
        recoveryCodes={recoveryCodes}
        onContinue={finishActivation}
      />
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {step === "credentials" ? "Activate your account" : "Set up 2FA"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {firstName} {lastName}
            {email ? ` · ${email}` : ""}
          </p>
          {expiresAt && step === "credentials" ? (
            <p className="text-sm text-muted-foreground">
              Link expires {new Date(expiresAt).toLocaleString()}.
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          {step === "credentials" ? (
            <ActivationCredentialsForm
              email={email}
              username={username}
              password={password}
              confirmPassword={confirmPassword}
              error={error}
              loading={loading}
              onUsernameChange={setUsername}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onSubmit={onCredentialsSubmit}
            />
          ) : (
            <ActivationTotpForm
              qrCodeDataUrl={qrCodeDataUrl}
              manualEntryKey={manualEntryKey}
              code={code}
              error={error}
              loading={loading}
              onCodeChange={setCode}
              onSubmit={onTotpSubmit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-background px-4">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <ActivateForm />
    </Suspense>
  );
}

"use client";

import {
  ActivationCredentialsForm,
  ActivationTotpForm,
} from "@/components/auth/activation-forms";
import {
  ActivationCompleteCard,
  ActivationUnavailableCard,
  RecoveryCodesCard,
} from "@/components/auth/activation-status-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  completeTenantActivation,
  completeTenantActivationTotp,
  validateTenantActivationToken,
} from "@/lib/auth/session-actions";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

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
      const result = await validateTenantActivationToken(token);
      setValidating(false);
      if (!result.ok) {
        setValid(false);
        return;
      }
      const payload = result.payload;
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

    const result = await completeTenantActivation({
      token,
      username,
      password,
      confirmPassword,
    });
    setLoading(false);

    if (!result.ok || typeof result.payload.challengeToken !== "string") {
      setError(result.ok ? "Activation failed" : result.error);
      return;
    }

    setChallengeToken(result.payload.challengeToken);
    setQrCodeDataUrl(result.payload.qrCodeDataUrl ?? null);
    setManualEntryKey(result.payload.manualEntryKey ?? null);
    setCode("");
    setStep("totp");
  }

  async function onTotpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await completeTenantActivationTotp({
      challengeToken,
      code,
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setRecoveryCodes(result.payload.recoveryCodes ?? []);
    setStep("recovery");
  }

  function finishActivation() {
    setStep("done");
    setTimeout(() => router.replace("/login"), 1200);
  }

  if (validating) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">
          Validating activation link…
        </p>
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

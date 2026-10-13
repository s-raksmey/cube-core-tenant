"use client";

import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormEvent } from "react";

type CredentialsFormProps = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  error: string | null;
  loading: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ActivationCredentialsForm({
  email,
  username,
  password,
  confirmPassword,
  error,
  loading,
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: CredentialsFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="activate-email">Email</Label>
        <Input
          id="activate-email"
          type="email"
          value={email}
          readOnly
          disabled
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="activate-username">Username</Label>
        <Input
          id="activate-username"
          value={username}
          onChange={(event) => onUsernameChange(event.target.value.trim())}
          autoComplete="username"
          required
          autoFocus
          minLength={2}
          maxLength={40}
          pattern="[a-zA-Z0-9._-]+"
        />
        <p className="text-xs text-muted-foreground">
          Letters, numbers, dots, underscores, and hyphens. You can sign in with
          username or email.
        </p>
      </div>
      <PasswordField
        id="activate-password"
        label="Password"
        value={password}
        onChange={onPasswordChange}
        autoComplete="new-password"
      />
      <PasswordField
        id="activate-confirm-password"
        label="Confirm password"
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        autoComplete="new-password"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Continuing…" : "Continue to 2FA"}
      </Button>
    </form>
  );
}

type TotpFormProps = {
  qrCodeDataUrl: string | null;
  manualEntryKey: string | null;
  code: string;
  error: string | null;
  loading: boolean;
  onCodeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ActivationTotpForm({
  qrCodeDataUrl,
  manualEntryKey,
  code,
  error,
  loading,
  onCodeChange,
  onSubmit,
}: TotpFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {qrCodeDataUrl ? (
        <div className="flex justify-center rounded-lg border border-border bg-background p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeDataUrl}
            alt="Authenticator QR code"
            className="size-48"
          />
        </div>
      ) : null}
      {manualEntryKey ? (
        <div className="space-y-1.5">
          <Label>Manual setup key</Label>
          <p className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs tracking-wider">
            {manualEntryKey}
          </p>
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="activate-totp">6-digit code</Label>
        <Input
          id="activate-totp"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(event) =>
            onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))
          }
          required
          autoFocus
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Verifying…" : "Verify and finish"}
      </Button>
    </form>
  );
}

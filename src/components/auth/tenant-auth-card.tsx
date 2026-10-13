"use client";

import type { FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";

export type TenantAuthStep = "landing" | "password" | "enroll" | "verify";
export type TenantAuthChallenge = { challengeToken: string; nextStep: "TOTP_ENROLL" | "TOTP_VERIFY"; qrCodeDataUrl?: string; manualEntryKey?: string };

type TenantAuthCardProps = { tenantName: string; step: TenantAuthStep; email: string; password: string; code: string; useRecoveryCode: boolean; challenge: TenantAuthChallenge | null; error: string | null; loading: boolean; onClose: () => void; onPasswordSubmit: (event: FormEvent<HTMLFormElement>) => void; onVerifySubmit: (event: FormEvent<HTMLFormElement>) => void; onEmailChange: (value: string) => void; onPasswordChange: (value: string) => void; onCodeChange: (value: string) => void; onToggleRecoveryCode: () => void };

/** Tenant-specific sign-in and two-factor form; networking remains in the flow. */
export function TenantAuthCard({ tenantName, step, email, password, code, useRecoveryCode, challenge, error, loading, onClose, onPasswordSubmit, onVerifySubmit, onEmailChange, onPasswordChange, onCodeChange, onToggleRecoveryCode }: TenantAuthCardProps) {
  return <Card className="w-full max-w-md border-border bg-card/95 shadow-sm backdrop-blur"><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle className="text-xl">Sign in to {tenantName}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Sub-tenant Admin or Editor sign-in with mandatory two-factor authentication.</p></div><Button type="button" variant="ghost" size="icon-sm" onClick={onClose} disabled={loading} aria-label="Close sign-in form"><X className="size-4" /></Button></CardHeader><CardContent className="space-y-4">
    {step === "password" ? <form className="space-y-4" onSubmit={onPasswordSubmit}><div className="space-y-1.5"><Label htmlFor="email">Username or email</Label><Input id="email" type="text" autoComplete="username" value={email} onChange={(event) => onEmailChange(event.target.value)} required disabled={loading} /></div><PasswordField id="password" value={password} onChange={onPasswordChange} disabled={loading} />{error ? <p className="text-sm text-destructive">{error}</p> : null}<Button type="submit" className="w-full" disabled={loading}>{loading ? "Continuing…" : "Continue"}</Button></form> : null}
    {step === "enroll" ? <form className="space-y-4" onSubmit={onVerifySubmit}>{challenge?.qrCodeDataUrl ? <div className="flex justify-center">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={challenge.qrCodeDataUrl} alt="QR code" className="size-44" /></div> : <p className="text-sm text-muted-foreground">Preparing authenticator setup…</p>}{challenge?.manualEntryKey ? <div className="space-y-1"><Label>Manual setup key</Label><p className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">{challenge.manualEntryKey}</p></div> : null}<CodeInput code={code} recovery={false} loading={loading} onChange={onCodeChange} />{error ? <p className="text-sm text-destructive">{error}</p> : null}<Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing you in…" : "Activate 2FA"}</Button></form> : null}
    {step === "verify" ? <form className="space-y-4" onSubmit={onVerifySubmit}><CodeInput code={code} recovery={useRecoveryCode} loading={loading} onChange={onCodeChange} /><button type="button" className="text-sm text-primary hover:underline disabled:opacity-50" disabled={loading} onClick={onToggleRecoveryCode}>{useRecoveryCode ? "Use authenticator code instead" : "Use a recovery code"}</button>{error ? <p className="text-sm text-destructive">{error}</p> : null}<Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing you in…" : "Verify"}</Button></form> : null}
  </CardContent></Card>;
}

function CodeInput({ code, recovery, loading, onChange }: { code: string; recovery: boolean; loading: boolean; onChange: (value: string) => void }) {
  return <div className="space-y-1.5"><Label htmlFor="tenant-auth-code">{recovery ? "Recovery code" : "6-digit code"}</Label><Input id="tenant-auth-code" inputMode={recovery ? "text" : "numeric"} maxLength={recovery ? 64 : 6} value={code} onChange={(event) => onChange(recovery ? event.target.value.trim().toUpperCase() : event.target.value.replace(/\D/g, "").slice(0, 6))} required autoFocus disabled={loading} /></div>;
}

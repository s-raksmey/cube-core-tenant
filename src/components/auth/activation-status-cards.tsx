"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { ReactNode } from "react";

type CenteredCardProps = {
  children: ReactNode;
};

function CenteredCard({ children }: CenteredCardProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">{children}</Card>
    </div>
  );
}

export function ActivationUnavailableCard() {
  return (
    <CenteredCard>
      <CardHeader>
        <CardTitle>Activation link unavailable</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          This activation link is invalid, expired, or already used. Ask a
          SuperAdmin for a new link.
        </p>
        <Link href="/login" className="text-primary hover:underline">
          Return to sign in
        </Link>
      </CardContent>
    </CenteredCard>
  );
}

export function ActivationCompleteCard() {
  return (
    <CenteredCard>
      <CardHeader>
        <CardTitle>Account activated</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        You can sign in with your username or email. Redirecting to login…
      </CardContent>
    </CenteredCard>
  );
}

export function RecoveryCodesCard({
  recoveryCodes,
  onContinue,
}: {
  recoveryCodes: string[];
  onContinue: () => void;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Save your recovery codes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Store these somewhere safe. Each code works once if you lose access
            to your authenticator.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="grid gap-2 rounded-md bg-muted p-3 font-mono text-sm">
            {recoveryCodes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() =>
              void navigator.clipboard.writeText(recoveryCodes.join("\n"))
            }
          >
            Copy codes
          </Button>
          <Button type="button" className="w-full" onClick={onContinue}>
            I saved my codes — continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

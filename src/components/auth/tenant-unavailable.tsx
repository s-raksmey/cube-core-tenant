import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TenantUnavailable() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-xl">Tenant unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This sign-in address could not be matched to an active sub-tenant.
            Check the address or contact your organization administrator.
          </p>
          {process.env.NODE_ENV !== "production" ? (
            <p className="mt-3 text-sm text-muted-foreground">
              For local development, ask a SuperAdmin to assign localhost to an
              active tenant in Tenant Management.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}

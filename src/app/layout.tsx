import { AppApolloProvider } from "@/components/providers/apollo-provider";
import { TenantDocumentTitleGuard } from "@/components/branding/tenant-document-title-guard";
import { tenantDocumentTitleStorageKey } from "@/lib/tenant-document-title";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: [
    {
      path: "../../public/fonts/Inter-VariableFont_opsz,wght.ttf",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../../public/fonts/Inter-Italic-VariableFont_opsz,wght.ttf",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  description: "Cube Core sub-tenant workspace",
  referrer: "no-referrer",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <Script id="tenant-workspace-title" strategy="beforeInteractive">
          {`try { const tenantName = localStorage.getItem("${tenantDocumentTitleStorageKey}"); if (tenantName) document.title = tenantName; } catch {}`}
        </Script>
        <TenantDocumentTitleGuard />
        <AppApolloProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </AppApolloProvider>
      </body>
    </html>
  );
}

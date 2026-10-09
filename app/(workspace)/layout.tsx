import { ConsoleGate } from "@/components/dashboard/console-gate";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsoleGate>{children}</ConsoleGate>;
}

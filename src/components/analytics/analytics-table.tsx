import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AnalyticsTable({
  title,
  rows,
  empty = "No activity in this period.",
}: {
  title: string;
  rows: readonly { id?: string; name: string; views: number; shares: number }[];
  empty?: string;
}) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!rows.length ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-80 text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 text-right font-medium">Views</th>
                  <th className="pb-2 text-right font-medium">Shares</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id ?? row.name}
                    className="border-b last:border-0"
                  >
                    <td
                      className="max-w-48 truncate py-2 pr-3"
                      title={row.name}
                    >
                      {row.name}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {row.views.toLocaleString()}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {row.shares.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

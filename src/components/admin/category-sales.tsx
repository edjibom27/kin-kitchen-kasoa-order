import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSectionShell } from "@/components/admin/section-shell";
import { formatCedis } from "@/lib/menu-data";
import { categorySalesQueryOptions, type DateRange } from "@/lib/admin-analytics";

export function AdminCategorySales({ range }: { range: DateRange }) {
  const queryClient = useQueryClient();
  const options = categorySalesQueryOptions(range);
  const { data, isPending, isError, error } = useQuery(options);

  const rows = data ?? [];
  const maxRevenue = Math.max(1, ...rows.map((r) => r.revenue));

  return (
    <AdminSectionShell
      title="Sales by category"
      description="Delivered + completed orders"
      isPending={isPending}
      isError={isError}
      error={error}
      isEmpty={!isPending && !isError && rows.length === 0}
      emptyMessage="No category sales in this range yet."
      onRetry={() => void queryClient.invalidateQueries({ queryKey: options.queryKey })}
    >
      <ul className="grid gap-4">
        {rows.map((row) => (
          <li key={row.categoryName} className="grid gap-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{row.categoryName}</span>
              <span className="text-muted-foreground">
                {row.quantitySold} sold · {formatCedis(row.revenue)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${(row.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </AdminSectionShell>
  );
}

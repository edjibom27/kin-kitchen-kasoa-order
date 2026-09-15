import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSectionShell } from "@/components/admin/section-shell";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { statusCountsQueryOptions, type DateRange } from "@/lib/admin-analytics";

export function AdminStatusBreakdown({ range }: { range: DateRange }) {
  const queryClient = useQueryClient();
  const options = statusCountsQueryOptions(range);
  const { data, isPending, isError, error } = useQuery(options);

  const counts = data ?? [];
  const max = Math.max(1, ...counts.map((c) => c.orderCount));
  const total = counts.reduce((sum, c) => sum + c.orderCount, 0);

  return (
    <AdminSectionShell
      title="Order status breakdown"
      description="All statuses, selected range"
      isPending={isPending}
      isError={isError}
      error={error}
      isEmpty={!isPending && !isError && total === 0}
      emptyMessage="No orders in this range yet."
      onRetry={() => void queryClient.invalidateQueries({ queryKey: options.queryKey })}
    >
      <ul className="grid gap-3">
        {counts.map((c) => (
          <li key={c.status} className="grid gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <OrderStatusBadge status={c.status} />
              <span className="text-sm font-semibold tabular-nums">{c.orderCount}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${(c.orderCount / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </AdminSectionShell>
  );
}

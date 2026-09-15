import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSectionShell } from "@/components/admin/section-shell";
import { customerInsightsQueryOptions, type DateRange } from "@/lib/admin-analytics";

export function AdminCustomerInsights({ range }: { range: DateRange }) {
  const queryClient = useQueryClient();
  const options = customerInsightsQueryOptions(range);
  const { data, isPending, isError, error } = useQuery(options);

  const metrics = data
    ? [
        { label: "Total Customers", value: data.totalCustomers, scope: "All-time" },
        { label: "New Customers", value: data.newCustomersInPeriod, scope: "Selected range" },
        { label: "Customers With Orders", value: data.customersWithOrders, scope: "All-time" },
        { label: "Returning Customers", value: data.returningCustomers, scope: "All-time" },
        {
          label: "Average Orders / Customer",
          value: data.avgOrdersPerCustomer.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2,
          }),
          scope: "All-time",
        },
      ]
    : [];

  return (
    <AdminSectionShell
      title="Customer insights"
      isPending={isPending}
      isError={isError}
      error={error}
      isEmpty={!isPending && !isError && data?.totalCustomers === 0}
      emptyMessage="No registered customers yet."
      onRetry={() => void queryClient.invalidateQueries({ queryKey: options.queryKey })}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-border/70 p-4">
            <p className="text-sm text-muted-foreground">{m.label}</p>
            <p className="mt-1 font-display text-xl font-bold">{m.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{m.scope}</p>
          </div>
        ))}
      </div>
    </AdminSectionShell>
  );
}

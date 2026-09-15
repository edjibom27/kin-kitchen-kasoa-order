import { useQuery } from "@tanstack/react-query";
import { AlertCircle, DollarSign, Receipt, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCedis } from "@/lib/menu-data";
import { dashboardOverviewQueryOptions, type DateRange } from "@/lib/admin-analytics";

export function AdminOverviewCards({ range }: { range: DateRange }) {
  const { data, isPending, isError, error, refetch } = useQuery(
    dashboardOverviewQueryOptions(range),
  );

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Couldn't load the overview."}
        </p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const cards = [
    {
      label: "Total Revenue",
      value: formatCedis(data.totalRevenue),
      icon: DollarSign,
      hint: "Delivered + completed orders",
    },
    {
      label: "Total Orders",
      value: data.totalOrders.toLocaleString(),
      icon: Receipt,
      hint: "All statuses, selected range",
    },
    {
      label: "Average Order Value",
      value: formatCedis(data.averageOrderValue),
      icon: TrendingUp,
      hint: "Per successful order",
    },
    {
      label: "Registered Customers",
      value: data.registeredCustomers.toLocaleString(),
      icon: Users,
      hint: "All-time, excludes staff/admin",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
            <card.icon className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{card.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}

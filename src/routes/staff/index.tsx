import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, Bike, ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffGuard } from "@/lib/staff-auth";
import { staffOrdersQueryOptions, type StatusFilter } from "@/lib/staff-orders";
import { formatCedis } from "@/lib/menu-data";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ORDER_STATUSES } from "@/lib/order-status";
import { StaffNav } from "@/components/staff-nav";
import { useState } from "react";

export const Route = createFileRoute("/staff/")({
  head: () => ({
    meta: [{ title: "Order dashboard — KIN Kitchen Staff" }],
  }),
  component: () => (
    <StaffGuard>
      <StaffDashboard />
    </StaffGuard>
  ),
});

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...ORDER_STATUSES.map((status) => ({
    value: status,
    label: status
      .split("_")
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(" "),
  })),
];

function StaffDashboard() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const {
    data: orders,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery(staffOrdersQueryOptions(filter));

  return (
    <div className="min-h-screen bg-background">
      <StaffNav active="orders" />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold">Order dashboard</h1>
        <div className="sticky top-0 z-30 -mx-4 mt-4 overflow-x-auto bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex w-max gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={filter === f.value ? "accent" : "outline"}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isPending
              ? "Loading orders…"
              : `${orders?.length ?? 0} order${orders?.length === 1 ? "" : "s"}`}
          </p>
          <Button variant="ghost" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

        <div className="mt-4 grid gap-4">
          {isPending && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-3xl" />
              ))}
            </>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-10 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="font-medium text-destructive">Couldn't load orders</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Please try again."}
              </p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          )}

          {!isPending && !isError && orders && orders.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground">
              <ShoppingBag className="h-8 w-8" />
              <p className="font-medium text-foreground">No orders here</p>
              <p className="text-sm">
                {filter === "all"
                  ? "No orders have come in yet."
                  : "No orders currently have this status."}
              </p>
            </div>
          )}

          {!isPending &&
            !isError &&
            orders?.map((order) => (
              <Link
                key={order.id}
                to="/staff/$orderNumber"
                params={{ orderNumber: order.order_number }}
                className="block rounded-3xl border border-border/70 bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold">{order.order_number}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.customer_name} · {order.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-accent">
                      {formatCedis(Number(order.total))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    {order.order_type === "delivery" ? (
                      <Bike className="h-4 w-4" />
                    ) : (
                      <Store className="h-4 w-4" />
                    )}
                    {order.order_type === "delivery" ? "Delivery" : "Pickup"}
                  </span>
                  <span>{order.payment_method === "cash" ? "Cash" : "Mobile Money"}</span>
                  {order.order_type === "delivery" && order.address && (
                    <span className="truncate">{order.address}</span>
                  )}
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}

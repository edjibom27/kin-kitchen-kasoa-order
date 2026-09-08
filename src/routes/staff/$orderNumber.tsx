import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { AlertCircle, ArrowLeft, Bike, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffGuard } from "@/lib/staff-auth";
import { staffOrderDetailQueryOptions, getNextStatusActions } from "@/lib/staff-orders";
import { updateOrderStatusFn } from "@/lib/staff.server";
import type { OrderStatus } from "@/lib/order-status";
import { formatCedis } from "@/lib/menu-data";
import { OrderStatusBadge, orderStatusLabel } from "@/components/order-status-badge";

export const Route = createFileRoute("/staff/$orderNumber")({
  head: ({ params }) => ({
    meta: [{ title: `${params.orderNumber} — KIN Kitchen Staff` }],
  }),
  component: () => (
    <StaffGuard>
      <StaffOrderDetailPage />
    </StaffGuard>
  ),
});

function StaffOrderDetailPage() {
  const { orderNumber } = Route.useParams();
  const queryClient = useQueryClient();
  const [updatingTo, setUpdatingTo] = useState<OrderStatus | null>(null);

  const {
    data: order,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(staffOrderDetailQueryOptions(orderNumber));

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setUpdatingTo(newStatus);
    try {
      const result = await updateOrderStatusFn({ data: { orderId, newStatus } });
      if (!result.ok) {
        toast.error(result.message);
        // The order may have changed elsewhere since we loaded it — refetch
        // so the displayed status/actions are accurate again.
        await refetch();
        return;
      }
      toast.success(`Order marked ${orderStatusLabel(result.status).toLowerCase()}`);
      await Promise.all([refetch(), queryClient.invalidateQueries({ queryKey: ["staff-orders"] })]);
    } catch {
      toast.error("We couldn't reach the server. Please try again.");
    } finally {
      setUpdatingTo(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-5 sm:px-6">
          <Button asChild variant="ghost" size="icon">
            <Link to="/staff">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              KIN Kitchen
            </p>
            <h1 className="text-xl font-bold">{orderNumber}</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {isPending && (
          <div className="grid gap-4">
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-10 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="font-medium text-destructive">Couldn't load this order</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        )}

        {!isPending && !isError && !order && (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground">
            <p className="font-medium text-foreground">Order not found</p>
            <p className="mt-1 text-sm">{orderNumber} doesn't match any existing order.</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/staff">Back to dashboard</Link>
            </Button>
          </div>
        )}

        {order && (
          <div className="grid gap-6">
            {/* Status + actions */}
            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <OrderStatusBadge status={order.status} />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Placed {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </p>
                </div>
                <p className="font-display text-2xl font-bold text-accent">
                  {formatCedis(Number(order.total))}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {getNextStatusActions(order.status, order.order_type).map((action) => (
                  <Button
                    key={action.status}
                    variant={action.variant}
                    size="sm"
                    disabled={updatingTo !== null}
                    onClick={() => void handleStatusChange(order.id, action.status)}
                  >
                    {updatingTo === action.status ? "Updating…" : action.label}
                  </Button>
                ))}
                {getNextStatusActions(order.status, order.order_type).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No further action needed — this order is in a final state.
                  </p>
                )}
              </div>
            </section>

            {/* Customer + fulfillment */}
            <section className="grid gap-6 rounded-3xl border border-border/70 bg-card p-6 shadow-soft sm:grid-cols-2">
              <div>
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Customer
                </h2>
                <p className="mt-2 font-medium">{order.customer_name}</p>
                <p className="text-sm text-muted-foreground">{order.phone}</p>
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Fulfillment
                </h2>
                <p className="mt-2 inline-flex items-center gap-1.5 font-medium">
                  {order.order_type === "delivery" ? (
                    <Bike className="h-4 w-4" />
                  ) : (
                    <Store className="h-4 w-4" />
                  )}
                  {order.order_type === "delivery" ? "Delivery" : "Pickup"}
                </p>
                {order.order_type === "delivery" && (
                  <>
                    {order.address && (
                      <p className="mt-1 text-sm text-muted-foreground">{order.address}</p>
                    )}
                    {order.landmark && (
                      <p className="text-sm text-muted-foreground">{order.landmark}</p>
                    )}
                  </>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  ~{order.prep_time_minutes} min prep time
                </p>
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Payment
                </h2>
                <p className="mt-2 font-medium">
                  {order.payment_method === "cash" ? "Cash" : "Mobile Money"}
                </p>
                {order.momo_number && (
                  <p className="text-sm text-muted-foreground">{order.momo_number}</p>
                )}
              </div>
            </section>

            {/* Items */}
            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Items</h2>
              <ul className="mt-4 divide-y divide-border">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{item.item_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {formatCedis(Number(item.unit_price))}
                      </p>
                    </div>
                    <p className="font-medium">{formatCedis(Number(item.line_total))}</p>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatCedis(Number(order.subtotal))}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Delivery fee</dt>
                  <dd>
                    {Number(order.delivery_fee) ? formatCedis(Number(order.delivery_fee)) : "Free"}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 flex justify-between border-t border-border pt-3">
                <span className="font-display font-semibold">Total</span>
                <span className="font-display text-lg font-bold text-accent">
                  {formatCedis(Number(order.total))}
                </span>
              </div>
            </section>

            {/* Status history */}
            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Status history</h2>
              <ol className="mt-4 grid gap-3">
                {order.order_status_history.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{orderStatusLabel(entry.status)}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(entry.created_at), "d MMM, h:mm a")}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

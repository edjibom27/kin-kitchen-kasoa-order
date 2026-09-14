import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { AlertCircle, ArrowLeft, Bike, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountGuard, useSupabaseSession } from "@/lib/customer-auth";
import { myOrderDetailQueryOptions } from "@/lib/account";
import { formatCedis } from "@/lib/menu-data";
import { OrderStatusBadge, orderStatusLabel } from "@/components/order-status-badge";

export const Route = createFileRoute("/account/orders/$orderNumber")({
  head: ({ params }) => ({ meta: [{ title: `${params.orderNumber} — My Orders` }] }),
  component: () => (
    <AccountGuard>
      <MyOrderDetailPage />
    </AccountGuard>
  ),
});

function MyOrderDetailPage() {
  const { orderNumber } = Route.useParams();
  const session = useSupabaseSession();
  const userId = session.status === "signed-in" ? session.session.user.id : "";

  const {
    data: order,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(myOrderDetailQueryOptions(orderNumber, userId));

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/account/orders">
          <ArrowLeft className="h-4 w-4" /> My Orders
        </Link>
      </Button>
      <h1 className="mt-2 text-2xl font-bold">{orderNumber}</h1>

      {isPending && (
        <div className="mt-6 grid gap-4">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-56 w-full rounded-3xl" />
        </div>
      )}

      {isError && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-10 text-center">
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
        <div className="mt-6 rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground">
          <p className="font-medium text-foreground">Order not found</p>
          <p className="mt-1 text-sm">This order doesn't exist or isn't linked to your account.</p>
        </div>
      )}

      {order && (
        <div className="mt-6 grid gap-6">
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
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              {order.order_type === "delivery" ? (
                <Bike className="h-4 w-4" />
              ) : (
                <Store className="h-4 w-4" />
              )}
              {order.order_type === "delivery" ? "Delivery" : "Pickup"}
              {order.order_type === "delivery" && order.address ? ` · ${order.address}` : ""}
            </p>
          </section>

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
  );
}

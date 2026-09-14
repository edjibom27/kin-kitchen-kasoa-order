import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountGuard, useSupabaseSession } from "@/lib/customer-auth";
import { myOrdersQueryOptions } from "@/lib/account";
import { formatCedis } from "@/lib/menu-data";
import { OrderStatusBadge } from "@/components/order-status-badge";

export const Route = createFileRoute("/account/orders/")({
  head: () => ({ meta: [{ title: "My Orders — KIN Kitchen" }] }),
  component: () => (
    <AccountGuard>
      <MyOrdersPage />
    </AccountGuard>
  ),
});

function MyOrdersPage() {
  const session = useSupabaseSession();
  const userId = session.status === "signed-in" ? session.session.user.id : "";
  const {
    data: orders,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(myOrdersQueryOptions(userId));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/account">
          <ArrowLeft className="h-4 w-4" /> My Account
        </Link>
      </Button>
      <h1 className="mt-2 text-3xl font-bold">My Orders</h1>

      <div className="mt-6 grid gap-4">
        {isPending && (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-3xl" />
            ))}
          </>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-10 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="font-medium text-destructive">Couldn't load your orders</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        )}

        {!isPending && !isError && orders?.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground">
            <ShoppingBag className="h-8 w-8" />
            <p className="font-medium text-foreground">No orders yet</p>
            <p className="text-sm">Your order history will show up here.</p>
            <Button asChild variant="hero" size="sm" className="mt-4">
              <Link to="/menu">Browse the menu</Link>
            </Button>
          </div>
        )}

        {!isPending &&
          !isError &&
          orders?.map((order) => (
            <Link
              key={order.id}
              to="/account/orders/$orderNumber"
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
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </p>
                </div>
                <p className="font-display text-lg font-bold text-accent">
                  {formatCedis(Number(order.total))}
                </p>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}

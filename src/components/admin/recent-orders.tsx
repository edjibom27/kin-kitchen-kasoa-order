import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { AdminSectionShell } from "@/components/admin/section-shell";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatCedis } from "@/lib/menu-data";
import { staffOrdersQueryOptions } from "@/lib/staff-orders";

const RECENT_ORDERS_LIMIT = 10;

/**
 * Deliberately NOT scoped to the analytics date-range filter — this is an
 * operational "what just happened" widget, independent of whatever
 * reporting period the rest of the dashboard is looking at. Reuses Stage
 * 2's existing fetchStaffOrders()/staffOrdersQueryOptions("all") entirely
 * as-is (same RLS, same data, same 20s polling) rather than introducing a
 * parallel order-fetching path — this file only slices the already-sorted
 * (newest first) result down to the most recent few.
 */
export function AdminRecentOrders() {
  const queryClient = useQueryClient();
  const options = staffOrdersQueryOptions("all");
  const { data, isPending, isError, error } = useQuery(options);

  const orders = (data ?? []).slice(0, RECENT_ORDERS_LIMIT);

  return (
    <AdminSectionShell
      title="Recent orders"
      description="Most recent orders, regardless of the selected date range"
      isPending={isPending}
      isError={isError}
      error={error}
      isEmpty={!isPending && !isError && orders.length === 0}
      emptyMessage="No orders yet."
      onRetry={() => void queryClient.invalidateQueries({ queryKey: options.queryKey })}
    >
      <div className="grid gap-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            to="/staff/$orderNumber"
            params={{ orderNumber: order.order_number }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 p-4 transition-colors hover:bg-secondary/60"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{order.order_number}</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {order.customer_name} ·{" "}
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </p>
            </div>
            <p className="font-display font-semibold text-accent">
              {formatCedis(Number(order.total))}
            </p>
          </Link>
        ))}
      </div>
    </AdminSectionShell>
  );
}

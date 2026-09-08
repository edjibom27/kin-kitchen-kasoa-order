import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { OrderStatus } from "@/lib/order-status";

export type StaffOrderSummary = Tables<"orders">;

export type StaffOrderDetail = Tables<"orders"> & {
  order_items: Tables<"order_items">[];
  order_status_history: Tables<"order_status_history">[];
};

export type StatusFilter = OrderStatus | "all";

/**
 * Every order list/detail read below is a plain client-side Supabase query —
 * no server function, no new RLS. Stage 1's existing policies already grant
 * staff/admin full SELECT on orders/order_items/order_status_history (see
 * supabase/migrations/20260901000001_rls_policies.sql); once signed in via
 * Supabase Auth, the browser's own session JWT is what RLS evaluates.
 */
export async function fetchStaffOrders(filter: StatusFilter): Promise<StaffOrderSummary[]> {
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (filter !== "all") {
    query = query.eq("status", filter);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }
  return data ?? [];
}

export async function fetchStaffOrderDetail(orderNumber: string): Promise<StaffOrderDetail | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*)")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load order: ${error.message}`);
  }
  if (!data) return null;

  const detail = data as StaffOrderDetail;
  detail.order_status_history = [...detail.order_status_history].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  detail.order_items = [...detail.order_items].sort((a, b) =>
    a.item_name.localeCompare(b.item_name),
  );
  return detail;
}

// Light polling instead of a Realtime subscription — keeps Stage 2 additive
// and simple; easy to swap for Realtime later without changing callers.
export const staffOrdersQueryOptions = (filter: StatusFilter) =>
  queryOptions({
    queryKey: ["staff-orders", filter],
    queryFn: () => fetchStaffOrders(filter),
    refetchInterval: 20_000,
  });

export const staffOrderDetailQueryOptions = (orderNumber: string) =>
  queryOptions({
    queryKey: ["staff-order", orderNumber],
    queryFn: () => fetchStaffOrderDetail(orderNumber),
    refetchInterval: 15_000,
  });

export type StatusAction = {
  status: OrderStatus;
  label: string;
  variant: "accent" | "destructive" | "outline";
};

/**
 * Which action buttons to show for an order's current status. This is a UX
 * convenience only — the real enforcement is update_order_status() on the
 * server, which re-validates the transition regardless of what the client
 * shows or sends.
 */
export function getNextStatusActions(
  status: OrderStatus,
  orderType: "delivery" | "pickup",
): StatusAction[] {
  switch (status) {
    case "pending":
      return [
        { status: "confirmed", label: "Confirm order", variant: "accent" },
        { status: "cancelled", label: "Cancel order", variant: "destructive" },
      ];
    case "confirmed":
      return [
        { status: "preparing", label: "Start preparing", variant: "accent" },
        { status: "cancelled", label: "Cancel order", variant: "destructive" },
      ];
    case "preparing":
      return [
        orderType === "delivery"
          ? { status: "out_for_delivery", label: "Send out for delivery", variant: "accent" }
          : { status: "ready", label: "Mark ready for pickup", variant: "accent" },
        { status: "cancelled", label: "Cancel order", variant: "destructive" },
      ];
    case "ready":
      return [{ status: "completed", label: "Mark picked up", variant: "accent" }];
    case "out_for_delivery":
      return [{ status: "delivered", label: "Mark delivered", variant: "accent" }];
    case "delivered":
    case "completed":
    case "cancelled":
      return [];
    default:
      return [];
  }
}

import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type CustomerProfile = Tables<"profiles">;

/**
 * All reads/writes below rely entirely on Stage 1's existing RLS:
 *   "profiles: users read own" / "profiles: users update own" (auth.uid() = id)
 *   "orders: owner or staff/admin read" (auth.uid() = user_id or staff/admin)
 *   "order_items"/"order_status_history": visible via their parent order
 * No new policies were needed for any of this — a customer could always
 * read their own rows, it just had no UI surfacing it until now. The
 * explicit .eq("user_id", userId) / .eq("id", userId) filters below are
 * redundant with RLS but kept for clarity and so a "not mine" row reads as
 * not-found rather than relying solely on the policy to filter silently.
 */

export async function fetchMyProfile(userId: string): Promise<CustomerProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load your profile: ${error.message}`);
  }
  return data;
}

export async function updateMyProfile(
  userId: string,
  patch: TablesUpdate<"profiles">,
): Promise<CustomerProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update your profile: ${error.message}`);
  }
  return data;
}

export const myProfileQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["my-profile", userId],
    queryFn: () => fetchMyProfile(userId),
  });

export type MyOrderSummary = Tables<"orders">;
export type MyOrderDetail = Tables<"orders"> & {
  order_items: Tables<"order_items">[];
  order_status_history: Tables<"order_status_history">[];
};

export async function fetchMyOrders(userId: string): Promise<MyOrderSummary[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load your orders: ${error.message}`);
  }
  return data ?? [];
}

export async function fetchMyOrderDetail(
  orderNumber: string,
  userId: string,
): Promise<MyOrderDetail | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(*)")
    .eq("order_number", orderNumber)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load that order: ${error.message}`);
  }
  if (!data) return null;

  const detail = data as MyOrderDetail;
  detail.order_status_history = [...detail.order_status_history].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  return detail;
}

export const myOrdersQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["my-orders", userId],
    queryFn: () => fetchMyOrders(userId),
  });

export const myOrderDetailQueryOptions = (orderNumber: string, userId: string) =>
  queryOptions({
    queryKey: ["my-order", orderNumber, userId],
    queryFn: () => fetchMyOrderDetail(orderNumber, userId),
  });

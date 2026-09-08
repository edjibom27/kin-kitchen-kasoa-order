import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { CartLine } from "@/lib/cart-context";
import type { OrderStatus } from "@/lib/order-status";

export type OrderType = "delivery" | "pickup";
export type PaymentMethod = "cash" | "momo";

export type Order = {
  id: string;
  orderNumber: string;
  guestToken: string;
  customerName: string;
  phone: string;
  orderType: OrderType;
  address: string | null;
  landmark: string | null;
  paymentMethod: PaymentMethod;
  momoNumber: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  prepTimeMinutes: number;
  createdAt: string;
  items: Array<{
    id: string;
    menuItemId: string | null;
    name: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
};

/**
 * Every code the `create_order` / `get_order` Postgres functions can raise
 * (see supabase/migrations/20260901000002_order_functions.sql), mapped to a
 * message that's safe and useful to show a customer. Anything not in this
 * list falls back to a generic message rather than leaking a raw DB error.
 */
const ORDER_ERROR_MESSAGES: Record<string, string> = {
  EMPTY_CART: "Your cart is empty.",
  RESTAURANT_SETTINGS_MISSING: "We can't take orders right now. Please try again shortly.",
  RESTAURANT_NOT_ACCEPTING_ORDERS: "We're not accepting orders right now — please check back soon.",
  DELIVERY_ADDRESS_REQUIRED: "Please enter a delivery address.",
  MOMO_NUMBER_REQUIRED: "Please enter a Mobile Money number.",
  MENU_ITEM_NOT_FOUND:
    "One of the items in your cart is no longer on the menu. Please review your cart.",
  MENU_ITEM_UNAVAILABLE:
    "One of the items in your cart just became unavailable. Please review your cart.",
  INVALID_QUANTITY: "One of the quantities in your cart is invalid.",
  INVALID_ITEM: "One of the items in your cart is invalid. Please review your cart.",
  INVALID_INPUT: "Please check your details and try again.",
  ORDER_NOT_FOUND: "We couldn't find that order.",
  UNAUTHORIZED: "We couldn't find that order.",
};

export type OrderActionResult =
  { ok: true; order: Order } | { ok: false; code: string; message: string };

/**
 * The Postgres functions raise errors formatted as `CODE: human text`
 * (see the migration). This pulls the stable CODE out so the frontend can
 * branch on it, and falls back to a generic message for anything
 * unrecognised rather than surfacing a raw database error to the customer.
 */
function toOrderError(rawMessage: string): { code: string; message: string } {
  const match = /^([A-Z_]+):/.exec(rawMessage);
  const code = match?.[1] ?? "UNKNOWN_ERROR";
  const message = ORDER_ERROR_MESSAGES[code] ?? "We couldn't place your order. Please try again.";
  return { code, message };
}

function mapOrderRow(raw: Record<string, unknown>): Order {
  const items = Array.isArray(raw["items"]) ? (raw["items"] as Record<string, unknown>[]) : [];
  return {
    id: String(raw["id"]),
    orderNumber: String(raw["order_number"]),
    guestToken: String(raw["guest_token"]),
    customerName: String(raw["customer_name"]),
    phone: String(raw["phone"]),
    orderType: raw["order_type"] as OrderType,
    address: (raw["address"] as string | null) ?? null,
    landmark: (raw["landmark"] as string | null) ?? null,
    paymentMethod: raw["payment_method"] as PaymentMethod,
    momoNumber: (raw["momo_number"] as string | null) ?? null,
    subtotal: Number(raw["subtotal"]),
    deliveryFee: Number(raw["delivery_fee"]),
    total: Number(raw["total"]),
    status: raw["status"] as OrderStatus,
    prepTimeMinutes: Number(raw["prep_time_minutes"]),
    createdAt: String(raw["created_at"]),
    items: items.map((it) => ({
      id: String(it["id"]),
      menuItemId: (it["menu_item_id"] as string | null) ?? null,
      name: String(it["item_name"]),
      unitPrice: Number(it["unit_price"]),
      quantity: Number(it["quantity"]),
      lineTotal: Number(it["line_total"]),
    })),
  };
}

const cartLineSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().positive(),
});

const createOrderInputSchema = z.object({
  customerName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  orderType: z.enum(["delivery", "pickup"]),
  address: z.string().trim().optional(),
  landmark: z.string().trim().optional(),
  paymentMethod: z.enum(["cash", "momo"]),
  momoNumber: z.string().trim().optional(),
  items: z.array(cartLineSchema).min(1),
});

/**
 * Submits a checkout to the server-authoritative `create_order` Postgres
 * function. Only item ids + quantities are sent — price, subtotal, delivery
 * fee and total are computed entirely inside the database from the current
 * `menu_items` / `restaurant_settings` rows, never from what the browser
 * calculated. See supabase/migrations/20260901000002_order_functions.sql.
 *
 * The client-side Zod validation on the checkout form (src/routes/checkout.tsx)
 * is still worth keeping for instant UX feedback, but it is NOT what makes
 * this safe — the database function re-validates everything regardless of
 * what this server function is given.
 *
 * Note on empty strings vs null: the generated Database type declares
 * p_address/p_landmark/p_momo_number as plain (non-nullable) `string`
 * because the underlying SQL function doesn't give them defaults — Supabase's
 * type generator doesn't mark scalar function args nullable the way it does
 * table columns. An empty string is passed instead of null when a field
 * doesn't apply (e.g. no address for a pickup order); the SQL function
 * treats "" the same as null via `coalesce`/`nullif`, so this has no effect
 * on stored data — see create_order() in the migration.
 */
export const createOrderFn = createServerFn({ method: "POST" })
  .validator(createOrderInputSchema)
  .handler(async ({ data }): Promise<OrderActionResult> => {
    const { data: result, error } = await supabase.rpc("create_order", {
      p_customer_name: data.customerName,
      p_phone: data.phone,
      p_order_type: data.orderType,
      p_address: data.orderType === "delivery" ? (data.address ?? "") : "",
      p_landmark: data.landmark || "",
      p_payment_method: data.paymentMethod,
      p_momo_number: data.paymentMethod === "momo" ? (data.momoNumber ?? "") : "",
      p_items: data.items.map((line) => ({
        menu_item_id: line.id,
        quantity: line.quantity,
      })),
    });

    if (error) {
      const { code, message } = toOrderError(error.message);
      return { ok: false, code, message };
    }
    if (!result) {
      return {
        ok: false,
        code: "UNKNOWN_ERROR",
        message: "We couldn't place your order. Please try again.",
      };
    }

    return { ok: true, order: mapOrderRow(result as Record<string, unknown>) };
  });

const getOrderInputSchema = z.object({
  orderNumber: z.string().min(1),
  guestToken: z.string().uuid().optional(),
});

/**
 * Looks up a previously created order for the order-confirmation page.
 * Guests (no account) must supply the guestToken returned by createOrderFn;
 * logged-in owners are matched server-side via their session instead — see
 * get_order() in the same migration.
 */
export const getOrderFn = createServerFn({ method: "GET" })
  .validator(getOrderInputSchema)
  .handler(async ({ data }): Promise<OrderActionResult> => {
    const { data: result, error } = await supabase.rpc("get_order", {
      p_order_number: data.orderNumber,
      ...(data.guestToken ? { p_guest_token: data.guestToken } : {}),
    });

    if (error) {
      const { code, message } = toOrderError(error.message);
      return { ok: false, code, message };
    }
    if (!result) {
      return { ok: false, code: "ORDER_NOT_FOUND", message: "We couldn't find that order." };
    }

    return { ok: true, order: mapOrderRow(result as Record<string, unknown>) };
  });

/** Converts the client cart shape straight into what createOrderFn expects. */
export function cartLinesToOrderItems(lines: CartLine[]) {
  return lines.map((line) => ({ id: line.id, quantity: line.quantity }));
}

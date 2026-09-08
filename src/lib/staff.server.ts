import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-status";

export type { OrderStatus };

export type StaffActionResult =
  | { ok: true; orderId: string; orderNumber: string; status: OrderStatus; updatedAt: string }
  | { ok: false; code: string; message: string };

/**
 * Every code `update_order_status()` can raise (see
 * supabase/migrations/20260906000000_stage2_order_status_management.sql),
 * mapped to a message safe to show in the staff dashboard.
 */
const STATUS_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "You don't have permission to update this order.",
  ORDER_NOT_FOUND: "That order could not be found. It may have been removed.",
  INVALID_STATUS_TRANSITION:
    "That status change isn't allowed from the order's current state. The order list has been refreshed — please check its current status.",
};

function toStaffError(rawMessage: string): { code: string; message: string } {
  const match = /^([A-Z_]+):/.exec(rawMessage);
  const code = match?.[1] ?? "UNKNOWN_ERROR";
  const message = STATUS_ERROR_MESSAGES[code] ?? "We couldn't update this order. Please try again.";
  return { code, message };
}

const updateOrderStatusInputSchema = z.object({
  orderId: z.string().uuid(),
  newStatus: z.enum(ORDER_STATUSES),
});

/**
 * Updates an order's status via the server-authoritative `update_order_status`
 * Postgres function (SECURITY DEFINER — validates the transition and writes
 * order_status_history atomically; see the Stage 2 migration).
 *
 * This runs through `requireSupabaseAuth`, which verifies the caller's own
 * Supabase session bearer token server-side and hands back a Supabase client
 * scoped to THAT user's JWT — RLS still applies, and no service-role key is
 * ever used here. `update_order_status()` re-checks is_staff_or_admin()
 * itself regardless, so this is defense in depth, not the only guard.
 */
export const updateOrderStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(updateOrderStatusInputSchema)
  .handler(async ({ data, context }): Promise<StaffActionResult> => {
    const { data: result, error } = await context.supabase.rpc("update_order_status", {
      p_order_id: data.orderId,
      p_new_status: data.newStatus,
    });

    if (error) {
      const { code, message } = toStaffError(error.message);
      return { ok: false, code, message };
    }
    if (!result) {
      return {
        ok: false,
        code: "UNKNOWN_ERROR",
        message: "We couldn't update this order. Please try again.",
      };
    }

    const row = result as Record<string, unknown>;
    return {
      ok: true,
      orderId: String(row["id"]),
      orderNumber: String(row["order_number"]),
      status: row["status"] as OrderStatus,
      updatedAt: String(row["updated_at"]),
    };
  });

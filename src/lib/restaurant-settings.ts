import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type RestaurantSettings = {
  deliveryFee: number;
  deliveryPrepMinutes: number;
  pickupPrepMinutes: number;
  isAcceptingOrders: boolean;
};

/**
 * The values checkout.tsx used to hardcode (GH₵15 delivery fee, 45/25 minute
 * prep times) now live in the `restaurant_settings` table so they can be
 * changed without a deploy. This always reads the most recently updated row.
 */
export async function fetchRestaurantSettings(): Promise<RestaurantSettings> {
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load restaurant settings: ${error.message}`);
  }
  if (!data) {
    throw new Error("Restaurant settings have not been configured yet.");
  }

  return {
    deliveryFee: Number(data.delivery_fee),
    deliveryPrepMinutes: data.delivery_prep_minutes,
    pickupPrepMinutes: data.pickup_prep_minutes,
    isAcceptingOrders: data.is_accepting_orders,
  };
}

/**
 * Stage 3: the raw settings row (with `id`), for the staff settings page —
 * updating a row needs its id, which the camelCase customer-facing shape
 * above deliberately omits. Read access is the same public SELECT policy
 * from Stage 1; only admin can actually call updateRestaurantSettings()
 * below (RLS-enforced, unchanged from Stage 1).
 */
export async function fetchRestaurantSettingsRow(): Promise<Tables<"restaurant_settings">> {
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load restaurant settings: ${error.message}`);
  }
  if (!data) {
    throw new Error("Restaurant settings have not been configured yet.");
  }
  return data;
}

export async function updateRestaurantSettings(
  id: string,
  patch: TablesUpdate<"restaurant_settings">,
): Promise<Tables<"restaurant_settings">> {
  const { data, error } = await supabase
    .from("restaurant_settings")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update restaurant settings: ${error.message}`);
  }
  return data;
}

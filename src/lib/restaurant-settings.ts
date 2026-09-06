import { supabase } from "@/integrations/supabase/client";

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

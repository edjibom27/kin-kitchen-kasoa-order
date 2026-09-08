import { Constants } from "@/integrations/supabase/types";

export type OrderStatus = (typeof Constants.public.Enums.order_status)[number];

export const ORDER_STATUSES = Constants.public.Enums.order_status;

import { queryOptions } from "@tanstack/react-query";
import { fetchCategories, fetchMenuItems } from "@/lib/menu-data";
import { fetchRestaurantSettings } from "@/lib/restaurant-settings";

export const menuItemsQueryOptions = () =>
  queryOptions({
    queryKey: ["menu-items"],
    queryFn: fetchMenuItems,
    staleTime: 60_000,
  });

export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 60_000,
  });

export const restaurantSettingsQueryOptions = () =>
  queryOptions({
    queryKey: ["restaurant-settings"],
    queryFn: fetchRestaurantSettings,
    staleTime: 30_000,
  });

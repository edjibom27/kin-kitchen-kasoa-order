import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

import jollof from "@/assets/jollof.jpg";
import waakye from "@/assets/waakye.jpg";
import banku from "@/assets/banku.jpg";
import fufu from "@/assets/fufu.jpg";
import burger from "@/assets/burger.jpg";
import chickenburger from "@/assets/chickenburger.jpg";
import pizza from "@/assets/pizza.jpg";
import noodles from "@/assets/noodles.jpg";
import friedrice from "@/assets/friedrice.jpg";
import drinks from "@/assets/drinks.jpg";
import wings from "@/assets/wings.jpg";

/**
 * Stage 1 still bundles food photography with the app (Supabase Storage
 * migration is a later stage). `menu_items.image_key` in the database names
 * one of these bundled assets; this map resolves it to the actual imported
 * image the UI renders. Falls back to the jollof image if an unknown key
 * ever shows up, so a bad row can't break the whole page.
 */
const IMAGE_MAP = {
  jollof,
  waakye,
  banku,
  fufu,
  burger,
  chickenburger,
  pizza,
  noodles,
  friedrice,
  drinks,
  wings,
} as const;

function resolveImage(imageKey: string): string {
  return (IMAGE_MAP as Record<string, string>)[imageKey] ?? jollof;
}

/** Valid `menu_items.image_key` values — used by the staff menu-item form so
 * staff can only pick a key that actually resolves to a real bundled image. */
export const IMAGE_KEYS = Object.keys(IMAGE_MAP) as (keyof typeof IMAGE_MAP)[];

export type Category = string;

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  /** Price in Ghanaian Cedis */
  price: number;
  category: Category;
  image: string;
  featured?: boolean;
};

type MenuItemRow = Tables<"menu_items">;
type CategoryRow = Tables<"categories">;

function toMenuItem(row: MenuItemRow, categoryName: string): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: categoryName,
    image: resolveImage(row.image_key),
    featured: row.is_featured,
  };
}

/**
 * Ordered category names, replacing the old hardcoded `CATEGORIES` tuple.
 */
export async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }
  return data ?? [];
}

/**
 * All currently-available menu items, joined with their category name so
 * the UI keeps consuming a flat `MenuItem[]` exactly as before.
 */
export async function fetchMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*, categories(name, sort_order)")
    .eq("is_available", true);

  if (error) {
    throw new Error(`Failed to load menu: ${error.message}`);
  }

  const rows = (data ?? []) as Array<
    MenuItemRow & { categories: { name: string; sort_order: number } | null }
  >;

  return rows
    .map((row) => ({
      item: toMenuItem(row, row.categories?.name ?? "Menu"),
      sortOrder: row.categories?.sort_order ?? 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.item.name.localeCompare(b.item.name))
    .map(({ item }) => item);
}

export async function fetchFeaturedItems(): Promise<MenuItem[]> {
  const items = await fetchMenuItems();
  return items.filter((item) => item.featured);
}

export function formatCedis(amount: number) {
  return `GH\u20B5 ${amount.toFixed(2)}`;
}

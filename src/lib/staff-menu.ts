import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type StaffMenuItem = Tables<"menu_items">;
export type StaffCategory = Tables<"categories">;

/**
 * All menu items regardless of availability — unlike the customer-facing
 * fetchMenuItems() in menu-data.ts, which only returns available items.
 * Staff/admin already have SELECT access to every row via Stage 1's
 * "menu_items: public read available, staff/admin read all" policy; this
 * is a plain, RLS-governed read, no new backend surface.
 */
export async function fetchAllMenuItemsForStaff(): Promise<StaffMenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load menu items: ${error.message}`);
  }
  return data ?? [];
}

/**
 * Creates a menu item. Allowed for staff or admin — see Stage 3 migration
 * "menu_items: staff/admin insert". `price` is genuinely staff-entered data
 * here (not customer input), so no RPC/server-side recomputation is needed
 * the way it is for create_order(): RLS confirming the caller is staff/admin
 * is the whole security requirement for this kind of trusted data entry.
 */
export async function createMenuItem(input: TablesInsert<"menu_items">): Promise<StaffMenuItem> {
  const { data, error } = await supabase.from("menu_items").insert(input).select("*").single();

  if (error) {
    throw new Error(`Failed to create menu item: ${error.message}`);
  }
  return data;
}

export async function updateMenuItem(
  id: string,
  patch: TablesUpdate<"menu_items">,
): Promise<StaffMenuItem> {
  const { data, error } = await supabase
    .from("menu_items")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update menu item: ${error.message}`);
  }
  return data;
}

/** Admin-only at the RLS level ("menu_items: admin delete", unchanged from
 * Stage 1) — a staff-role caller gets a clean RLS rejection here, which
 * getSupabaseErrorMessage() below turns into a friendly message. */
export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) {
    throw new Error(getSupabaseErrorMessage(error, "delete this menu item"));
  }
}

export async function createCategory(input: TablesInsert<"categories">): Promise<StaffCategory> {
  const { data, error } = await supabase.from("categories").insert(input).select("*").single();

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, "create this category"));
  }
  return data;
}

export async function updateCategory(
  id: string,
  patch: TablesUpdate<"categories">,
): Promise<StaffCategory> {
  const { data, error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, "update this category"));
  }
  return data;
}

/**
 * Deletion is blocked at the schema level (Stage 1:
 * `menu_items.category_id references categories(id) on delete restrict`)
 * when any menu item still points at this category — Postgres raises a
 * foreign-key-violation (error code 23503), which this turns into a
 * friendly message instead of a raw database error.
 */
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "This category still has menu items assigned to it. Move or delete those items first.",
      );
    }
    throw new Error(getSupabaseErrorMessage(error, "delete this category"));
  }
}

/** RLS rejections surface as a generic Postgres permission-denied message;
 * this turns that into something a staff member can actually act on. */
function getSupabaseErrorMessage(
  error: { code?: string; message: string },
  action: string,
): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message)) {
    return `You don't have permission to ${action}.`;
  }
  return `Failed to ${action}: ${error.message}`;
}

export const staffMenuItemsQueryOptions = () =>
  queryOptions({
    queryKey: ["staff-menu-items"],
    queryFn: fetchAllMenuItemsForStaff,
  });

export const staffCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["staff-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) {
        throw new Error(`Failed to load categories: ${error.message}`);
      }
      return data ?? [];
    },
  });

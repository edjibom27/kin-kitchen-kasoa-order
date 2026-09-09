-- KIN Kitchen — Stage 3: menu & restaurant management
--
-- Per the Stage 3 role split:
--   Admin — full control: categories (CRUD), menu_items (CRUD), restaurant_settings (RUD)
--   Staff — can create/edit menu_items and toggle availability/price, but
--           cannot delete menu_items, and cannot write categories or
--           restaurant_settings at all (view only, via the existing public
--           SELECT policies already in place since Stage 1)
--
-- categories and restaurant_settings need NO changes: Stage 1 already
-- restricts their writes to admin only, which matches Stage 3's spec
-- exactly. Only menu_items needs widening, and only for INSERT/UPDATE —
-- DELETE stays admin-only, untouched, so staff can never remove a menu item.
--
-- Category deletion safety is already enforced at the schema level: Stage 1
-- declared `menu_items.category_id references categories(id) on delete
-- restrict`, so the database itself refuses to delete a category that still
-- has menu items pointing at it. No migration changes needed for that.

drop policy if exists "menu_items: admin write" on public.menu_items;
drop policy if exists "menu_items: admin update" on public.menu_items;

create policy "menu_items: staff/admin insert"
  on public.menu_items for insert
  with check (public.is_staff_or_admin(auth.uid()));

create policy "menu_items: staff/admin update"
  on public.menu_items for update
  using (public.is_staff_or_admin(auth.uid()))
  with check (public.is_staff_or_admin(auth.uid()));

-- "menu_items: admin delete" (Stage 1) is left exactly as-is: only admin can
-- delete a menu item. No statement needed here — this comment documents
-- that the omission is deliberate, not an oversight.

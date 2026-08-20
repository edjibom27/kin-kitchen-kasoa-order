# KIN Kitchen — Backend & Admin Dashboard Plan

## Goal
Turn the current frontend-only KIN Kitchen demo into a real restaurant ordering system by adding a Lovable Cloud backend, persisting orders, and giving the kitchen an admin dashboard to manage them.

## What we will build

1. **Enable Lovable Cloud**
   - Provision the Supabase project linked to this repo.
   - This unlocks database, authentication, and server functions with no external accounts.

2. **Database schema**
   - `menu_items` — replaces the static menu list; supports availability toggles later.
   - `orders` — stores customer details, order type, payment method, totals, status, and timestamps.
   - `order_items` — line items linked to each order.

3. **Seed the menu**
   - Migrate the 22 items from `src/lib/menu-data.ts` into the `menu_items` table via a migration.
   - Keep the existing UI types so the frontend continues to work.

4. **Server functions**
   - `placeOrder` — validates the checkout payload, writes the order and line items, returns the order number.
   - `getOrderByNumber` — fetches a single order for the confirmation page.
   - `getOrders` — admin-only list of recent orders with filtering by status.
   - `updateOrderStatus` — admin-only status transitions (received → preparing → ready → out for delivery / completed / cancelled).

5. **Update checkout & confirmation**
   - Replace the localStorage `saveOrder` flow with a call to `placeOrder`.
   - Redirect to `/order-confirmation/:orderNumber` and load the real persisted order.

6. **Admin dashboard**
   - New protected route at `/admin/orders`.
   - Simple table view of orders: number, customer, phone, type, total, status, time.
   - Status update buttons per order.
   - Detail drawer or page showing items, address/landmark, and payment method.

7. **Authentication (minimal)**
   - Enable Lovable Cloud Auth.
   - Create a single admin role/policy so only staff can access `/admin/*`.
   - Customer ordering remains guest-only; no login required to place an order.

## Technical approach

- Use `createServerFn` from `@tanstack/react-start` for all backend operations.
- Use the generated Supabase client for public reads and `requireSupabaseAuth` middleware for admin writes.
- Keep RLS enabled: public can read `menu_items`; only authenticated admin users can read/write `orders` and `order_items`.
- Preserve the existing Tailwind/shadcn UI design system and page structure.

## Out of scope for this plan

- Real online payment gateway (Paystack/Flutterwave). Cash and Mobile Money will still be confirmed manually by the restaurant, matching the current checkout copy.
- Customer accounts or order-history pages.
- Real-time SMS/push notifications to the kitchen.
- Inventory/stock management beyond an `available` flag.

## Success criteria

- A customer can add items to cart, check out, and see a real order number persisted in the database.
- A logged-in admin can open `/admin/orders`, see the new order, and update its status.
- The menu still loads from the database without changing the public page layout.

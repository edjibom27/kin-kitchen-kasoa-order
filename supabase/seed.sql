-- KIN Kitchen — Stage 1 seed data
-- Mirrors src/lib/menu-data.ts exactly (22 items, 5 categories) plus the
-- initial restaurant_settings row used by the current checkout flow.
-- Safe to re-run: seeding is idempotent via ON CONFLICT.

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

insert into public.categories (name, sort_order) values
  ('Ghanaian', 0),
  ('Burgers', 1),
  ('Pizza', 2),
  ('Chinese', 3),
  ('Drinks', 4)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------

insert into public.menu_items (slug, category_id, name, description, price, image_key, is_featured)
values
  ('gh-jollof-chicken', (select id from public.categories where name = 'Ghanaian'), 'Jollof Rice & Grilled Chicken', 'Smoky party jollof cooked in rich tomato stew, served with grilled chicken and fried plantain.', 65, 'jollof', true),
  ('gh-waakye-special', (select id from public.categories where name = 'Ghanaian'), 'Waakye Special', 'Rice and beans with shito, spaghetti, boiled egg, gari and fried fish. The full Kasoa experience.', 55, 'waakye', true),
  ('gh-banku-tilapia', (select id from public.categories where name = 'Ghanaian'), 'Banku & Grilled Tilapia', 'Soft banku with a whole grilled tilapia and fresh pepper-onion sauce on the side.', 90, 'banku', true),
  ('gh-fufu-light-soup', (select id from public.categories where name = 'Ghanaian'), 'Fufu & Goat Light Soup', 'Hand-pounded fufu in peppery light soup loaded with tender goat meat.', 75, 'fufu', false),
  ('gh-fried-rice-chicken', (select id from public.categories where name = 'Ghanaian'), 'Ghana Fried Rice & Chicken', 'Vegetable fried rice with a quarter grilled chicken, coleslaw and house shito.', 60, 'friedrice', false),
  ('gh-wings', (select id from public.categories where name = 'Ghanaian'), 'Peppered Chicken Wings', 'Six wings glazed in our sweet-hot pepper sauce. Great for sharing on campus.', 45, 'wings', false),
  ('bg-kin-classic', (select id from public.categories where name = 'Burgers'), 'KIN Classic Beef Burger', 'Double beef patty, melted cheddar, lettuce, red onion and our signature burger sauce.', 70, 'burger', true),
  ('bg-crispy-chicken', (select id from public.categories where name = 'Burgers'), 'Crispy Chicken Burger', 'Buttermilk-fried chicken thigh with slaw and spicy mayo in a toasted brioche bun.', 65, 'chickenburger', false),
  ('bg-shito-burger', (select id from public.categories where name = 'Burgers'), 'Shito Smash Burger', 'Smashed beef patty with caramelised onions and a bold shito aioli. Local heat, global style.', 75, 'burger', false),
  ('bg-student-combo', (select id from public.categories where name = 'Burgers'), 'Student Burger Combo', 'Single beef burger, fries and a chilled soft drink. Made for tight budgets and big appetites.', 55, 'chickenburger', false),
  ('pz-pepperoni', (select id from public.categories where name = 'Pizza'), 'Classic Pepperoni Pizza', 'Stone-baked 12" base, mozzarella and generous pepperoni on slow-cooked tomato sauce.', 120, 'pizza', true),
  ('pz-suya-chicken', (select id from public.categories where name = 'Pizza'), 'Suya Chicken Pizza', 'Spiced suya chicken, red onion, green pepper and mozzarella. A KIN Kitchen favourite.', 135, 'pizza', false),
  ('pz-margherita', (select id from public.categories where name = 'Pizza'), 'Margherita', 'Simple and perfect: tomato, mozzarella and fresh basil on a chewy hand-stretched crust.', 100, 'pizza', false),
  ('pz-family-meat', (select id from public.categories where name = 'Pizza'), 'Family Meat Feast', '16" sharing pizza with beef, chicken, sausage and peppers. Feeds three to four.', 185, 'pizza', false),
  ('cn-chow-mein', (select id from public.categories where name = 'Chinese'), 'Chicken Chow Mein', 'Wok-tossed noodles with chicken, crunchy vegetables and a savoury soy-garlic sauce.', 70, 'noodles', true),
  ('cn-special-fried-rice', (select id from public.categories where name = 'Chinese'), 'Special Fried Rice', 'Shrimp, chicken and egg fried rice finished with spring onion and sesame oil.', 85, 'friedrice', false),
  ('cn-sweet-sour-chicken', (select id from public.categories where name = 'Chinese'), 'Sweet & Sour Chicken', 'Crispy chicken in tangy sweet-and-sour sauce with pineapple and peppers, served with rice.', 80, 'noodles', false),
  ('cn-veg-noodles', (select id from public.categories where name = 'Chinese'), 'Vegetable Stir-Fry Noodles', 'Egg noodles with garlic, ginger and seasonal vegetables. Light, fresh and meat-free.', 55, 'noodles', false),
  ('dr-sobolo', (select id from public.categories where name = 'Drinks'), 'Chilled Sobolo (500ml)', 'House-brewed hibiscus drink with ginger, pineapple and cloves. Served ice cold.', 15, 'drinks', false),
  ('dr-fresh-juice', (select id from public.categories where name = 'Drinks'), 'Fresh Fruit Juice', 'Blended pineapple, orange and watermelon juice with no added sugar.', 20, 'drinks', false),
  ('dr-soft-drink', (select id from public.categories where name = 'Drinks'), 'Assorted Soft Drinks', 'Chilled Coke, Fanta, Sprite or Malt — your pick, always cold.', 10, 'drinks', false),
  ('dr-water', (select id from public.categories where name = 'Drinks'), 'Bottled Water (750ml)', 'Purified table water to keep the pepper under control.', 5, 'drinks', false)
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  image_key = excluded.image_key,
  is_featured = excluded.is_featured;

-- ---------------------------------------------------------------------------
-- restaurant_settings
-- ---------------------------------------------------------------------------

-- Only seed if no settings row exists yet, so re-running this file never
-- clobbers values an admin has since changed via the (future) admin UI.
insert into public.restaurant_settings (
  delivery_fee, delivery_prep_minutes, pickup_prep_minutes, is_accepting_orders
)
select 15.00, 45, 25, true
where not exists (select 1 from public.restaurant_settings);

# KIN Kitchen Ordering App

Build a modern, responsive restaurant ordering website called KIN Kitchen, a fictional restaurant based in Kasoa, Ghana.

KIN Kitchen serves a mix of Ghanaian food, burgers, pizza, Chinese food, and drinks. Its target customers are students, families, and working professionals.

Brand & visual identity

Create a polished, modern food-brand aesthetic rather than a generic restaurant template.

Use:

Deep charcoal as the primary color

Warm orange as the main accent color

Warm cream/off-white as the background

Clean, modern typography

Rounded cards and buttons

High-quality food photography

Subtle animations and hover effects

Plenty of whitespace

Strong mobile-first responsive design

The overall feeling should be modern, appetizing, friendly, and premium enough for professionals while still appealing to students and families.

Brand tagline:
"Good food. Your way."

Pages

Create these customer-facing pages:

Home

Menu

Cart

Checkout

Order Confirmation

HOME PAGE

Create a strong hero section containing:

KIN Kitchen
"Good food. Your way."

Supporting text:
"From local Ghanaian favourites to burgers, pizza and Chinese-inspired dishes, there's something for everyone."

Primary CTA:
Order Now

Secondary CTA:
View Menu

Include:

Featured dishes section

Food category section

Why choose KIN Kitchen section

Delivery & pickup information

A strong final call-to-action

Footer with contact/location information

Mention Kasoa naturally throughout the website.

MENU PAGE

Create a clean restaurant menu with approximately 20 sample items.

Use these categories:

Ghanaian

Burgers

Pizza

Chinese

Drinks

Create realistic sample Ghanaian menu items and realistic prices in Ghanaian Cedis (GH₵).

Each menu item should contain:

Food image

Name

Short description

Price

Category

"Add to Cart" button

Include category filtering.

The menu should feel like a real restaurant menu rather than placeholder cards.

CART

Create a functional shopping cart.

Customers should be able to:

Add items

Increase/decrease quantity

Remove items

See item subtotal

See total order amount

Continue shopping

Proceed to checkout

Persist the cart while navigating between pages.

CHECKOUT

Create a clean checkout form.

Collect:

Full name

Phone number

Order type: Delivery or Pickup

Delivery address when Delivery is selected

Landmark/additional delivery instructions

Payment method

Payment options:

Cash

Mobile Money

For Mobile Money, collect the customer's MoMo phone number.

Do NOT integrate a real payment gateway yet. This is an MVP and payment will be manually confirmed by the restaurant.

Show a clear order summary before submission.

ORDER CONFIRMATION

After an order is successfully submitted, show:

"Order received!"

Display:

Order number

Customer name

Items ordered

Total amount

Order type

Payment method

Estimated preparation time

Include a button to return to the menu.

IMPORTANT TECHNICAL REQUIREMENTS

Build this as a real functional web application, not just a static mockup.

Use a clean component structure and reusable UI components.

Make the website fully responsive, with special attention to mobile users because many customers will order from their phones.

Use realistic sample content rather than lorem ipsum.

For now, focus on the customer-facing experience and working cart/checkout flow.

Do NOT build the restaurant admin dashboard, authentication, real payment gateway, or advanced backend functionality yet. We will build those in later stages.

Make sure the project is structured so a real database and restaurant order-management backend can be added in the next stage without rebuilding the customer interface.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5922c7bb-d9f5-4a69-b31e-7135ebe4069e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

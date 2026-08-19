import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { formatCedis } from "@/lib/menu-data";
import { DELIVERY_FEE } from "@/lib/orders";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — KIN Kitchen Kasoa" },
      {
        name: "description",
        content:
          "Review your KIN Kitchen order, adjust quantities and continue to checkout for delivery or pickup in Kasoa.",
      },
      { property: "og:title", content: "Your Cart — KIN Kitchen" },
      {
        property: "og:description",
        content: "Review your KIN Kitchen order before checkout.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, increment, decrement, removeItem, itemCount } =
    useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </span>
        <h1 className="mt-6 text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">
          Add a few dishes from the menu and we'll start cooking.
        </p>
        <Button asChild variant="hero" size="lg" className="mt-8">
          <Link to="/menu">Browse the menu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-4xl font-bold">Your cart</h1>
      <p className="mt-2 text-muted-foreground">
        {itemCount} {itemCount === 1 ? "item" : "items"} ready to go.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {lines.map((line) => (
            <li
              key={line.id}
              className="flex gap-4 rounded-3xl border border-border/70 bg-card p-4 shadow-soft"
            >
              <img
                src={line.image}
                alt={line.name}
                loading="lazy"
                width={800}
                height={800}
                className="h-24 w-24 shrink-0 rounded-2xl object-cover sm:h-28 sm:w-28"
              />
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-base font-semibold">
                      {line.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {formatCedis(line.price)} each
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(line.id)}
                    aria-label={`Remove ${line.name}`}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 rounded-full border border-border p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`Decrease quantity of ${line.name}`}
                      onClick={() => decrement(line.id)}
                    >
                      <Minus />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {line.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`Increase quantity of ${line.name}`}
                      onClick={() => increment(line.id)}
                    >
                      <Plus />
                    </Button>
                  </div>
                  <span className="font-display text-base font-bold">
                    {formatCedis(line.price * line.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-3xl border border-border/70 bg-card p-6 shadow-soft lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatCedis(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery (Kasoa)</dt>
              <dd className="font-medium">
                {formatCedis(DELIVERY_FEE)}{" "}
                <span className="text-muted-foreground">or free pickup</span>
              </dd>
            </div>
          </dl>
          <div className="mt-5 flex justify-between border-t border-border pt-5">
            <span className="font-display text-base font-semibold">Total</span>
            <span className="font-display text-xl font-bold text-accent">
              {formatCedis(subtotal)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Delivery fee is added at checkout if you choose delivery.
          </p>

          <Button asChild variant="hero" size="lg" className="mt-6 w-full">
            <Link to="/checkout">Proceed to checkout</Link>
          </Button>
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link to="/menu">Continue shopping</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}

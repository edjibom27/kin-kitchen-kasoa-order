import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MenuItemCard } from "@/components/menu-item-card";
import { Button } from "@/components/ui/button";
import { CATEGORIES, MENU_ITEMS, type Category } from "@/lib/menu-data";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — KIN Kitchen Kasoa | Ghanaian, Burgers, Pizza, Chinese" },
      {
        name: "description",
        content:
          "Browse the KIN Kitchen menu in Kasoa: jollof, waakye, banku, burgers, stone-baked pizza, Chinese noodles and chilled drinks. Prices in Ghana Cedis.",
      },
      { property: "og:title", content: "KIN Kitchen Menu — Kasoa, Ghana" },
      {
        property: "og:description",
        content:
          "Ghanaian favourites, burgers, pizza, Chinese dishes and drinks. Order for delivery or pickup in Kasoa.",
      },
    ],
  }),
  component: MenuPage,
});

type Filter = Category | "All";

function MenuPage() {
  const [filter, setFilter] = useState<Filter>("All");
  const items =
    filter === "All"
      ? MENU_ITEMS
      : MENU_ITEMS.filter((item) => item.category === filter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Our Menu
        </p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
          Everything we cook in Kasoa
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Freshly prepared to order. Prices include takeaway packaging — no
          hidden charges.
        </p>
      </header>

      <div className="sticky top-16 z-30 -mx-4 mt-8 overflow-x-auto bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex w-max gap-2">
          {(["All", ...CATEGORIES] as Filter[]).map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={filter === cat ? "accent" : "outline"}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {items.length} {items.length === 1 ? "dish" : "dishes"} available
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

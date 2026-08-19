import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bike,
  Flame,
  Leaf,
  MapPin,
  ShoppingBag,
  Star,
  Timer,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuItemCard } from "@/components/menu-item-card";
import heroImage from "@/assets/hero.jpg";
import jollof from "@/assets/jollof.jpg";
import burger from "@/assets/burger.jpg";
import pizza from "@/assets/pizza.jpg";
import noodles from "@/assets/noodles.jpg";
import drinks from "@/assets/drinks.jpg";
import { FEATURED_ITEMS } from "@/lib/menu-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "KIN Kitchen Kasoa — Good food. Your way. Order Online",
      },
      {
        name: "description",
        content:
          "KIN Kitchen in Kasoa serves Ghanaian favourites, burgers, pizza, Chinese dishes and drinks. Order online for fast delivery or pickup.",
      },
      {
        property: "og:title",
        content: "KIN Kitchen Kasoa — Good food. Your way.",
      },
      {
        property: "og:description",
        content:
          "Ghanaian classics, burgers, pizza and Chinese-inspired dishes, delivered hot across Kasoa.",
      },
    ],
  }),
  component: HomePage,
});

const CATEGORY_TILES = [
  { name: "Ghanaian", image: jollof, blurb: "Jollof, waakye, banku & fufu" },
  { name: "Burgers", image: burger, blurb: "Smashed, crispy & loaded" },
  { name: "Pizza", image: pizza, blurb: "Stone-baked, 12\" and 16\"" },
  { name: "Chinese", image: noodles, blurb: "Wok noodles & fried rice" },
  { name: "Drinks", image: drinks, blurb: "Sobolo, juices & sodas" },
];

const REASONS = [
  {
    icon: Flame,
    title: "Cooked fresh to order",
    body: "Nothing sits under a heat lamp. Your food starts cooking when your order lands.",
  },
  {
    icon: Wallet,
    title: "Fair student-friendly prices",
    body: "Combos from GH₵ 55 and honest portions that keep families and professionals full.",
  },
  {
    icon: Leaf,
    title: "Local ingredients",
    body: "Produce, fish and spices sourced from Kasoa market suppliers we know by name.",
  },
  {
    icon: Timer,
    title: "Fast around Kasoa",
    body: "Most deliveries land within 45 minutes; pickup is usually ready in 25.",
  },
];

function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:py-24">
          <div className="fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
              <MapPin className="h-3.5 w-3.5 text-accent" /> Kasoa, Ghana
            </span>
            <h1 className="mt-5 text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
              KIN Kitchen
            </h1>
            <p className="mt-4 font-display text-2xl font-semibold text-accent sm:text-3xl">
              Good food. Your way.
            </p>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              From local Ghanaian favourites to burgers, pizza and
              Chinese-inspired dishes, there's something for everyone.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero" size="lg">
                <Link to="/menu">
                  <ShoppingBag /> Order Now
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/menu">View Menu</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-accent text-accent" /> 4.8 from 600+
                Kasoa orders
              </span>
              <span className="flex items-center gap-1.5">
                <Bike className="h-4 w-4 text-accent" /> Delivery from GH₵ 15
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-lift">
              <img
                src={heroImage}
                alt="A spread of jollof rice, a burger, pizza and noodles from KIN Kitchen"
                width={1600}
                height={1200}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-5 hidden rounded-2xl bg-card px-5 py-4 shadow-lift sm:block">
              <p className="font-display text-sm font-semibold">
                Ready in 25 minutes
              </p>
              <p className="text-xs text-muted-foreground">
                Pickup at Kasoa New Market
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured dishes */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Most loved
            </p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Featured dishes
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link to="/menu">See full menu</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_ITEMS.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="text-3xl font-bold sm:text-4xl">Browse by category</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Five kitchens under one roof, so nobody in the group has to compromise.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORY_TILES.map((tile) => (
            <Link
              key={tile.name}
              to="/menu"
              className="card-hover group relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft"
            >
              <img
                src={tile.image}
                alt={`${tile.name} dishes at KIN Kitchen`}
                loading="lazy"
                width={800}
                height={800}
                className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-110 sm:h-36"
              />
              <div className="p-4">
                <h3 className="font-display text-base font-semibold">
                  {tile.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tile.blurb}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      <section className="mt-16 bg-secondary/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Why choose KIN Kitchen
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            We cook the way you'd cook for your own family — just faster.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((reason) => (
              <div
                key={reason.title}
                className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/12">
                  <reason.icon className="h-5 w-5 text-accent" />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold">
                  {reason.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {reason.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery & pickup */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/12">
              <Bike className="h-5 w-5 text-accent" />
            </span>
            <h3 className="mt-4 font-display text-xl font-semibold">Delivery</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We deliver across Kasoa — Ofaakor, Opeikuma, Millennium City, Toll
              Booth, Bortianor Junction and nearby areas. Flat GH₵ 15 fee,
              typical arrival in 45 minutes. Rider calls you on arrival.
            </p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/12">
              <ShoppingBag className="h-5 w-5 text-accent" />
            </span>
            <h3 className="mt-4 font-display text-xl font-semibold">Pickup</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Collect free of charge from our kitchen opposite Kasoa New Market.
              Most pickup orders are boxed and ready in about 25 minutes, daily
              from 9:00am to 10:00pm.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="gradient-charcoal relative overflow-hidden rounded-[2rem] px-6 py-14 text-center text-primary-foreground sm:px-12">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Hungry? Let's get cooking.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/70">
            Build your order in under two minutes, pay with cash or Mobile Money,
            and we'll handle the rest.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="hero" size="lg">
              <Link to="/menu">Order Now</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/cart">View Cart</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="gradient-charcoal mt-24 text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="gradient-warm flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-bold text-accent-foreground">
              K
            </span>
            <span className="font-display text-lg font-bold">KIN Kitchen</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-primary-foreground/70">
            Good food. Your way. Cooked fresh in Kasoa and delivered hot to
            homes, offices and hostels across the municipality.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
            Visit us
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/70">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              Opposite Kasoa New Market, Kasoa, Central Region, Ghana
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              +233 55 012 3456
            </li>
            <li className="flex gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              Mon – Sun, 9:00am – 10:00pm
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
            Explore
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
            <li>
              <Link to="/" className="transition-colors hover:text-accent">
                Home
              </Link>
            </li>
            <li>
              <Link to="/menu" className="transition-colors hover:text-accent">
                Menu
              </Link>
            </li>
            <li>
              <Link to="/cart" className="transition-colors hover:text-accent">
                Cart
              </Link>
            </li>
            <li>
              <Link to="/checkout" className="transition-colors hover:text-accent">
                Checkout
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-6 text-center text-xs text-primary-foreground/50">
        © {new Date().getFullYear()} KIN Kitchen, Kasoa. All rights reserved.
      </div>
    </footer>
  );
}

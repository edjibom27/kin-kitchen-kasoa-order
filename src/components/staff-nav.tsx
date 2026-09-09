import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOutStaff, useStaffSession } from "@/lib/staff-auth";

const NAV_ITEMS = [
  { to: "/staff", label: "Orders", key: "orders" as const },
  { to: "/staff/menu", label: "Menu Management", key: "menu" as const },
  { to: "/staff/settings", label: "Settings", key: "settings" as const },
];

export function StaffNav({ active }: { active: "orders" | "menu" | "settings" }) {
  const session = useStaffSession();

  return (
    <header className="border-b border-border/70 bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            KIN Kitchen
          </p>
          <nav className="mt-2 flex flex-wrap gap-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className={cn(
                  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  active === item.key && "text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {session.status === "authorized" && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.session.user.email} · {session.role}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => void signOutStaff()}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

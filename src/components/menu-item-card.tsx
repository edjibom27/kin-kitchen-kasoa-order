import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { formatCedis, type MenuItem } from "@/lib/menu-data";

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart();

  return (
    <article className="card-hover group flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground">
          {item.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-tight">
            {item.name}
          </h3>
          <span className="shrink-0 font-display text-base font-bold text-accent">
            {formatCedis(item.price)}
          </span>
        </div>
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>
        <Button
          variant="accent"
          className="w-full"
          onClick={() => {
            addItem(item);
            toast.success(`${item.name} added to cart`);
          }}
        >
          <Plus /> Add to Cart
        </Button>
      </div>
    </article>
  );
}

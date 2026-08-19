import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCedis } from "@/lib/menu-data";
import { loadLastOrder, type Order } from "@/lib/orders";

export const Route = createFileRoute("/order-confirmation")({
  head: () => ({
    meta: [
      { title: "Order Received — KIN Kitchen Kasoa" },
      {
        name: "description",
        content:
          "Your KIN Kitchen order has been received. We'll call to confirm and start cooking right away in Kasoa.",
      },
      { property: "og:title", content: "Order Received — KIN Kitchen" },
      {
        property: "og:description",
        content: "Thanks for ordering from KIN Kitchen in Kasoa.",
      },
    ],
  }),
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOrder(loadLastOrder());
    setLoaded(true);
  }, []);

  if (!loaded) return <div className="min-h-[60vh]" />;

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">No recent order found</h1>
        <p className="mt-3 text-muted-foreground">
          Place an order and your confirmation will show up here.
        </p>
        <Button asChild variant="hero" size="lg" className="mt-8">
          <Link to="/menu">Back to menu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <div className="fade-up rounded-3xl border border-border/70 bg-card p-6 text-center shadow-soft sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </span>
        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">Order received!</h1>
        <p className="mt-3 text-muted-foreground">
          Thanks {order.customerName.split(" ")[0]} — our Kasoa kitchen is on it.
          We'll call {order.phone} shortly to confirm.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold">
          <Clock className="h-4 w-4 text-accent" />
          Estimated {order.orderType === "delivery" ? "delivery" : "pickup"} in{" "}
          {order.prepTimeMinutes} minutes
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Order number" value={order.orderNumber} />
          <Detail label="Customer" value={order.customerName} />
          <Detail
            label="Order type"
            value={order.orderType === "delivery" ? "Delivery" : "Pickup"}
          />
          <Detail
            label="Payment method"
            value={order.paymentMethod === "cash" ? "Cash" : "Mobile Money"}
          />
          {order.address && <Detail label="Address" value={order.address} />}
          {order.landmark && <Detail label="Landmark" value={order.landmark} />}
          {order.momoNumber && (
            <Detail label="MoMo number" value={order.momoNumber} />
          )}
        </dl>

        <h2 className="mt-8 font-display text-lg font-semibold">
          Items ordered
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {order.items.map((line) => (
            <li key={line.id} className="flex justify-between gap-3">
              <span className="text-muted-foreground">
                {line.quantity} × {line.name}
              </span>
              <span className="shrink-0 font-medium">
                {formatCedis(line.price * line.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatCedis(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {order.deliveryFee ? "Delivery fee" : "Pickup"}
            </dt>
            <dd>
              {order.deliveryFee ? formatCedis(order.deliveryFee) : "Free"}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex justify-between border-t border-border pt-4">
          <span className="font-display font-semibold">Total amount</span>
          <span className="font-display text-xl font-bold text-accent">
            {formatCedis(order.total)}
          </span>
        </div>

        <Button asChild variant="hero" size="lg" className="mt-8 w-full">
          <Link to="/menu">Back to menu</Link>
        </Button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

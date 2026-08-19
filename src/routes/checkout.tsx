import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart-context";
import { formatCedis } from "@/lib/menu-data";
import {
  DELIVERY_FEE,
  generateOrderNumber,
  saveOrder,
  type OrderType,
  type PaymentMethod,
} from "@/lib/orders";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — KIN Kitchen Kasoa" },
      {
        name: "description",
        content:
          "Complete your KIN Kitchen order: choose delivery or pickup in Kasoa and pay with cash or Mobile Money on confirmation.",
      },
      { property: "og:title", content: "Checkout — KIN Kitchen" },
      {
        property: "og:description",
        content: "Delivery or pickup in Kasoa. Pay with cash or Mobile Money.",
      },
    ],
  }),
  component: CheckoutPage,
});

const phoneRule = z
  .string()
  .trim()
  .regex(/^[0-9+\s-]{9,15}$/, { message: "Enter a valid phone number" });

const baseSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Please enter your full name" })
    .max(80),
  phone: phoneRule,
  orderType: z.enum(["delivery", "pickup"]),
  address: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(300).optional(),
  paymentMethod: z.enum(["cash", "momo"]),
  momoNumber: z.string().trim().optional(),
});

const checkoutSchema = baseSchema
  .refine(
    (data) =>
      data.orderType !== "delivery" || (data.address?.length ?? 0) >= 5,
    { path: ["address"], message: "Delivery address is required" },
  )
  .refine(
    (data) =>
      data.paymentMethod !== "momo" ||
      phoneRule.safeParse(data.momoNumber ?? "").success,
    { path: ["momoNumber"], message: "Enter a valid MoMo number" },
  );

type Errors = Record<string, string | undefined>;

function CheckoutPage() {
  const navigate = useNavigate();
  const { lines, subtotal, clearCart } = useCart();
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = orderType === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Nothing to check out yet</h1>
        <p className="mt-3 text-muted-foreground">
          Add some dishes to your cart first.
        </p>
        <Button asChild variant="hero" size="lg" className="mt-8">
          <Link to="/menu">Go to menu</Link>
        </Button>
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = checkoutSchema.safeParse({
      fullName: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      orderType,
      address: String(formData.get("address") ?? ""),
      landmark: String(formData.get("landmark") ?? ""),
      paymentMethod,
      momoNumber: String(formData.get("momoNumber") ?? ""),
    });

    if (!parsed.success) {
      const fieldErrors: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please check the highlighted fields");
      return;
    }

    setErrors({});
    setSubmitting(true);

    const data = parsed.data;
    const order = {
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      customerName: data.fullName,
      phone: data.phone,
      orderType: data.orderType,
      address: data.orderType === "delivery" ? data.address : undefined,
      landmark: data.landmark || undefined,
      paymentMethod: data.paymentMethod,
      momoNumber: data.paymentMethod === "momo" ? data.momoNumber : undefined,
      items: lines,
      subtotal,
      deliveryFee,
      total,
      prepTimeMinutes: data.orderType === "delivery" ? 45 : 25,
    };

    saveOrder(order);
    clearCart();
    navigate({ to: "/order-confirmation" });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-4xl font-bold">Checkout</h1>
      <p className="mt-2 text-muted-foreground">
        We'll call you to confirm before we start cooking.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]"
      >
        <div className="space-y-6">
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Your details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors["fullName"]}>
                <Input
                  name="fullName"
                  placeholder="Ama Mensah"
                  maxLength={80}
                  autoComplete="name"
                />
              </Field>
              <Field label="Phone number" error={errors["phone"]}>
                <Input
                  name="phone"
                  placeholder="024 123 4567"
                  inputMode="tel"
                  maxLength={15}
                  autoComplete="tel"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">How to get it</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <OptionCard
                title="Delivery"
                description={`Anywhere in Kasoa · ${formatCedis(DELIVERY_FEE)}`}
                selected={orderType === "delivery"}
                onSelect={() => setOrderType("delivery")}
              />
              <OptionCard
                title="Pickup"
                description="Collect at our Kasoa kitchen · Free"
                selected={orderType === "pickup"}
                onSelect={() => setOrderType("pickup")}
              />
            </div>

            {orderType === "delivery" && (
              <div className="mt-5 grid gap-4">
                <Field label="Delivery address" error={errors["address"]}>
                  <Input
                    name="address"
                    placeholder="House 24, Ofaakor Road, Kasoa"
                    maxLength={200}
                  />
                </Field>
                <Field
                  label="Landmark / delivery instructions"
                  error={errors["landmark"]}
                  optional
                >
                  <Textarea
                    name="landmark"
                    placeholder="Near Kasoa Toll Booth, blue gate. Call on arrival."
                    maxLength={300}
                    rows={3}
                  />
                </Field>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Payment</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Payment is confirmed manually by our team — nothing is charged
              online.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <OptionCard
                title="Cash"
                description="Pay on delivery or at pickup"
                selected={paymentMethod === "cash"}
                onSelect={() => setPaymentMethod("cash")}
              />
              <OptionCard
                title="Mobile Money"
                description="MTN, Telecel or AT MoMo"
                selected={paymentMethod === "momo"}
                onSelect={() => setPaymentMethod("momo")}
              />
            </div>
            {paymentMethod === "momo" && (
              <div className="mt-5">
                <Field label="MoMo phone number" error={errors["momoNumber"]}>
                  <Input
                    name="momoNumber"
                    placeholder="055 012 3456"
                    inputMode="tel"
                    maxLength={15}
                  />
                </Field>
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-border/70 bg-card p-6 shadow-soft lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {lines.map((line) => (
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
              <dd>{formatCedis(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {orderType === "delivery" ? "Delivery fee" : "Pickup"}
              </dt>
              <dd>{deliveryFee ? formatCedis(deliveryFee) : "Free"}</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-border pt-4">
            <span className="font-display font-semibold">Total</span>
            <span className="font-display text-xl font-bold text-accent">
              {formatCedis(total)}
            </span>
          </div>

          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="mt-6 w-full"
            disabled={submitting}
          >
            {submitting ? "Placing order…" : "Place order"}
          </Button>
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link to="/cart">Back to cart</Link>
          </Button>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  optional,
  children,
}: {
  label: string;
  error?: string | undefined;
  optional?: boolean | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm font-medium">
        {label}
        {optional && (
          <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
        )}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function OptionCard({
  title,
  description,
  selected,
  onSelect,
}: {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-2xl border p-4 text-left transition-all ${
        selected
          ? "border-accent bg-accent/10 shadow-soft"
          : "border-border hover:border-accent/50 hover:bg-secondary"
      }`}
    >
      <span className="block font-display text-sm font-semibold">{title}</span>
      <span className="mt-1 block text-xs text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

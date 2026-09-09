import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffGuard, useStaffSession } from "@/lib/staff-auth";
import { StaffNav } from "@/components/staff-nav";
import { fetchRestaurantSettingsRow, updateRestaurantSettings } from "@/lib/restaurant-settings";

export const Route = createFileRoute("/staff/settings")({
  head: () => ({
    meta: [{ title: "Settings — KIN Kitchen Staff" }],
  }),
  component: () => (
    <StaffGuard>
      <StaffSettingsPage />
    </StaffGuard>
  ),
});

function StaffSettingsPage() {
  const session = useStaffSession();
  const isAdmin = session.status === "authorized" && session.role === "admin";
  const queryClient = useQueryClient();

  const {
    data: settings,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["staff-restaurant-settings"],
    queryFn: fetchRestaurantSettingsRow,
  });

  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState("");
  const [deliveryPrepMinutes, setDeliveryPrepMinutes] = useState("");
  const [pickupPrepMinutes, setPickupPrepMinutes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setIsAcceptingOrders(settings.is_accepting_orders);
    setDeliveryFee(String(settings.delivery_fee));
    setDeliveryPrepMinutes(String(settings.delivery_prep_minutes));
    setPickupPrepMinutes(String(settings.pickup_prep_minutes));
  }, [settings]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;

    const fee = Number(deliveryFee);
    const deliveryMinutes = Number(deliveryPrepMinutes);
    const pickupMinutes = Number(pickupPrepMinutes);

    if (!Number.isFinite(fee) || fee < 0) {
      toast.error("Delivery fee must be zero or greater.");
      return;
    }
    if (!Number.isInteger(deliveryMinutes) || deliveryMinutes <= 0) {
      toast.error("Delivery prep time must be a whole number of minutes.");
      return;
    }
    if (!Number.isInteger(pickupMinutes) || pickupMinutes <= 0) {
      toast.error("Pickup prep time must be a whole number of minutes.");
      return;
    }

    setSaving(true);
    try {
      await updateRestaurantSettings(settings.id, {
        is_accepting_orders: isAcceptingOrders,
        delivery_fee: fee,
        delivery_prep_minutes: deliveryMinutes,
        pickup_prep_minutes: pickupMinutes,
      });
      toast.success("Settings updated");
      void queryClient.invalidateQueries({ queryKey: ["staff-restaurant-settings"] });
      // Customer-facing key too — same-session checkout/cart pick this up
      // immediately instead of waiting out their 30s staleTime.
      void queryClient.invalidateQueries({ queryKey: ["restaurant-settings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <StaffNav active="settings" />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold">Restaurant Settings</h1>
        {!isAdmin && (
          <p className="mt-1 text-sm text-muted-foreground">
            You can view these settings, but only an admin can change them.
          </p>
        )}

        {isPending && (
          <div className="mt-6 grid gap-4">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        )}

        {isError && (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-10 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="font-medium text-destructive">Couldn't load settings</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        )}

        {settings && (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <fieldset disabled={!isAdmin || saving} className="grid gap-4">
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                <div>
                  <Label htmlFor="accepting-orders" className="cursor-pointer text-base">
                    Accepting orders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Turn off to pause new orders from the customer site.
                  </p>
                </div>
                <Switch
                  id="accepting-orders"
                  checked={isAcceptingOrders}
                  onCheckedChange={setIsAcceptingOrders}
                />
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                <Label htmlFor="delivery-fee">Delivery fee (GH₵)</Label>
                <Input
                  id="delivery-fee"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                  <Label htmlFor="delivery-prep">Delivery prep time (minutes)</Label>
                  <Input
                    id="delivery-prep"
                    type="number"
                    step="1"
                    min="1"
                    value={deliveryPrepMinutes}
                    onChange={(e) => setDeliveryPrepMinutes(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                  <Label htmlFor="pickup-prep">Pickup prep time (minutes)</Label>
                  <Input
                    id="pickup-prep"
                    type="number"
                    step="1"
                    min="1"
                    value={pickupPrepMinutes}
                    onChange={(e) => setPickupPrepMinutes(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </fieldset>

            {isAdmin && (
              <Button type="submit" variant="hero" size="lg" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

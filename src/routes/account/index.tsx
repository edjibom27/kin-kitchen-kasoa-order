import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountGuard, signOut, useSupabaseSession } from "@/lib/customer-auth";
import { myProfileQueryOptions, updateMyProfile } from "@/lib/account";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account/")({
  head: () => ({ meta: [{ title: "My Account — KIN Kitchen" }] }),
  component: () => (
    <AccountGuard>
      <AccountPage />
    </AccountGuard>
  ),
});

function AccountPage() {
  const session = useSupabaseSession();
  const userId = session.status === "signed-in" ? session.session.user.id : "";
  const queryClient = useQueryClient();

  const {
    data: profile,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(myProfileQueryOptions(userId));

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultAddress, setDefaultAddress] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setDefaultAddress(profile.default_address ?? "");
  }, [profile]);

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    setSavingProfile(true);
    try {
      await updateMyProfile(userId, {
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        default_address: defaultAddress.trim() || null,
      });
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["my-profile", userId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setSavingPassword(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">My Account</h1>
        <Button variant="outline" size="sm" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
      {session.status === "signed-in" && (
        <p className="mt-1 text-sm text-muted-foreground">{session.session.user.email}</p>
      )}

      <Button asChild variant="secondary" className="mt-6 w-full justify-start gap-2 sm:w-auto">
        <Link to="/account/orders">
          <ClipboardList className="h-4 w-4" /> My Orders
        </Link>
      </Button>

      {isPending && (
        <div className="mt-8 grid gap-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      )}

      {isError && (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="font-medium text-destructive">Couldn't load your profile</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Please try again."}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      )}

      {!isPending && !isError && (
        <>
          <form
            onSubmit={handleSaveProfile}
            className="mt-8 grid gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-soft"
          >
            <h2 className="font-display text-lg font-semibold">Profile</h2>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={15}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="defaultAddress">Default delivery address</Label>
              <Input
                id="defaultAddress"
                value={defaultAddress}
                onChange={(e) => setDefaultAddress(e.target.value)}
                maxLength={200}
                placeholder="House 24, Ofaakor Road, Kasoa"
              />
              <p className="text-xs text-muted-foreground">
                Pre-fills delivery checkout — you can still change it per order.
              </p>
            </div>
            <Button
              type="submit"
              variant="hero"
              disabled={savingProfile}
              className="justify-self-start"
            >
              {savingProfile ? "Saving…" : "Save changes"}
            </Button>
          </form>

          <form
            onSubmit={handleChangePassword}
            className="mt-6 grid gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-soft"
          >
            <h2 className="font-display text-lg font-semibold">Change password</h2>
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmNewPassword">Confirm new password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={savingPassword}
              className="justify-self-start"
            >
              {savingPassword ? "Updating…" : "Update password"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

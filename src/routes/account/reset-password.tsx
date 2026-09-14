import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/lib/customer-auth";

export const Route = createFileRoute("/account/reset-password")({
  head: () => ({ meta: [{ title: "Set a new password — KIN Kitchen" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  // Clicking the emailed reset link lands here with a Supabase "recovery"
  // session already established from the URL — the same session mechanism
  // useSupabaseSession() already watches for. No separate token-parsing
  // code needed.
  const session = useSupabaseSession();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    toast.success("Password updated");
    setDone(true);
  }

  if (session.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Checking your reset link…</p>
      </div>
    );
  }

  if (session.status === "signed-out") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-8 text-center shadow-soft">
          <h1 className="text-xl font-bold">This link has expired</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Password reset links only work once and expire after a while. Request a new one to
            continue.
          </p>
          <Button asChild variant="hero" className="mt-6 w-full">
            <Link to="/account/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-8 text-center shadow-soft">
          <h1 className="text-xl font-bold">Password updated</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You're signed in with your new password.
          </p>
          <Button asChild variant="hero" className="mt-6 w-full">
            <Link to="/account">Go to your account</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">KIN Kitchen</p>
        <h1 className="mt-2 text-2xl font-bold">Set a new password</h1>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" variant="hero" size="lg" disabled={submitting}>
            {submitting ? "Saving…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

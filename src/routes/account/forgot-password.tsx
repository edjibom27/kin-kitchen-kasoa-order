import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account/forgot-password")({
  head: () => ({ meta: [{ title: "Reset your password — KIN Kitchen" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    // Deliberately ignore the result and always show the same confirmation
    // screen — this is the standard way to avoid revealing whether an email
    // has an account. Rate-limit/network errors fail silently here too, on
    // the same principle; there's nothing actionable to tell the visitor
    // either way.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/account/reset-password`,
    });
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-8 text-center shadow-soft">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15">
            <Mail className="h-7 w-7 text-success" />
          </span>
          <h1 className="mt-5 text-xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            If an account exists for {email}, we've sent a link to reset your password.
          </p>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link to="/account/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">KIN Kitchen</p>
        <h1 className="mt-2 text-2xl font-bold">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we'll send you a link to reset it.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" variant="hero" size="lg" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <Link
          to="/account/login"
          className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

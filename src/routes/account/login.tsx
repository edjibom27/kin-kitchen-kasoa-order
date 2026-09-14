import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/lib/customer-auth";

export const Route = createFileRoute("/account/login")({
  head: () => ({ meta: [{ title: "Sign in — KIN Kitchen" }] }),
  component: LoginPage,
});

function LoginPage() {
  const session = useSupabaseSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (session.status === "signed-in") {
      navigate({ to: "/account" });
    }
  }, [session.status, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setShowResend(false);
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (signInError) {
      // Supabase returns this specific message when email confirmation is
      // required and hasn't happened yet — surface a targeted fix (resend)
      // rather than a generic "wrong password" message.
      if (/email not confirmed/i.test(signInError.message)) {
        setError("Please confirm your email before signing in.");
        setShowResend(true);
      } else {
        setError("Incorrect email or password.");
      }
      return;
    }

    navigate({ to: "/account" });
  }

  async function handleResend() {
    setResending(true);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });
    setResending(false);
    if (resendError) {
      toast.error("Couldn't resend the confirmation email. Please try again shortly.");
      return;
    }
    toast.success("Confirmation email sent — check your inbox.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">KIN Kitchen</p>
        <h1 className="mt-2 text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to track your orders and check out faster.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/account/forgot-password"
                className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="grid gap-2">
              <p className="text-sm text-destructive">{error}</p>
              {showResend && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resending}
                  onClick={() => void handleResend()}
                >
                  {resending ? "Sending…" : "Resend confirmation email"}
                </Button>
              )}
            </div>
          )}
          <Button type="submit" variant="hero" size="lg" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to KIN Kitchen?{" "}
          <Link to="/account/signup" className="font-medium text-foreground hover:underline">
            Create an account
          </Link>
        </p>
        <Link
          to="/"
          className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Continue as guest
        </Link>
      </div>
    </div>
  );
}

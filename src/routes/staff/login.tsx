import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useStaffSession, signOutStaff } from "@/lib/staff-auth";

export const Route = createFileRoute("/staff/login")({
  head: () => ({
    meta: [{ title: "Staff sign in — KIN Kitchen" }],
  }),
  component: StaffLoginPage,
});

function StaffLoginPage() {
  const session = useStaffSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session.status === "authorized") {
      navigate({ to: "/staff" });
    }
  }, [session.status, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("Incorrect email or password.");
      setSubmitting(false);
      return;
    }

    toast.success("Signed in");
    navigate({ to: "/staff" });
  }

  if (session.status === "unauthorized") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <h1 className="text-2xl font-bold">Signed in, but not staff</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {session.session.user.email} doesn't have staff access. Sign out and try a different
          account, or contact an administrator.
        </p>
        <Button variant="outline" onClick={() => void signOutStaff()}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">KIN Kitchen</p>
        <h1 className="mt-2 text-2xl font-bold">Staff sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          For kitchen and front-of-house staff only.
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" variant="hero" size="lg" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <Link
          to="/"
          className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Back to KIN Kitchen
        </Link>
      </div>
    </div>
  );
}

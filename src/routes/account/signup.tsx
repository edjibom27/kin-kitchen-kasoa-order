import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/lib/customer-auth";

export const Route = createFileRoute("/account/signup")({
  head: () => ({ meta: [{ title: "Create an account — KIN Kitchen" }] }),
  component: SignupPage,
});

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your name").max(80),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\s-]{9,15}$/, "Enter a valid phone number"),
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

type Errors = Record<string, string | undefined>;

function SignupPage() {
  const session = useSupabaseSession();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (session.status === "signed-in") {
      navigate({ to: "/account" });
    }
  }, [session.status, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = signupSchema.safeParse({
      fullName,
      phone,
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const fieldErrors: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    const data = parsed.data;
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName, phone: data.phone },
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });

    setSubmitting(false);

    if (error) {
      setErrors({ form: error.message });
      return;
    }

    // Email confirmation is required for new accounts — signUp() does not
    // return an active session in that case. Show a "check your inbox"
    // screen rather than pretending they're logged in. We also deliberately
    // show this same screen even if the email already has an account
    // (Supabase's own anti-enumeration behavior), so this page never reveals
    // whether an email is already registered.
    setCheckEmail(true);
  }

  if (checkEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-8 text-center shadow-soft">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15">
            <MailCheck className="h-7 w-7 text-success" />
          </span>
          <h1 className="mt-5 text-xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            If {email} isn't already registered, we've sent a confirmation link. Click it to
            activate your account, then come back and sign in.
          </p>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link to="/account/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">KIN Kitchen</p>
        <h1 className="mt-2 text-2xl font-bold">Create an account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your orders and check out faster next time.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={80}
            />
            {errors["fullName"] && <p className="text-xs text-destructive">{errors["fullName"]}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={15}
            />
            {errors["phone"] && <p className="text-xs text-destructive">{errors["phone"]}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors["email"] && <p className="text-xs text-destructive">{errors["email"]}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors["password"] && <p className="text-xs text-destructive">{errors["password"]}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errors["confirmPassword"] && (
              <p className="text-xs text-destructive">{errors["confirmPassword"]}</p>
            )}
          </div>
          {errors["form"] && <p className="text-sm text-destructive">{errors["form"]}</p>}
          <Button type="submit" variant="hero" size="lg" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/account/login" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export type StaffRole = "staff" | "admin";

export type StaffSessionState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "unauthorized"; session: Session }
  | { status: "authorized"; session: Session; role: StaffRole };

/**
 * Resolves the current Supabase Auth session and, if one exists, whether
 * that user holds a 'staff' or 'admin' row in user_roles. Reading a user's
 * OWN roles is already permitted by Stage 1's user_roles SELECT policy
 * (`auth.uid() = user_id`) — no new RLS needed here.
 *
 * This hook is a UX gate only. The actual security boundary is Stage 1's
 * RLS on orders/order_items/order_status_history and Stage 2's
 * update_order_status() function — both re-check the caller's role
 * server-side regardless of what this hook decides to render.
 */
export function useStaffSession(): StaffSessionState {
  const [state, setState] = useState<StaffSessionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function resolveRole(session: Session) {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["staff", "admin"])
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        setState({ status: "unauthorized", session });
        return;
      }
      setState({ status: "authorized", session, role: data.role as StaffRole });
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (!data.session) {
        setState({ status: "signed-out" });
        return;
      }
      void resolveRole(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (!session) {
        setState({ status: "signed-out" });
        return;
      }
      void resolveRole(session);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signOutStaff() {
  await supabase.auth.signOut();
}

/**
 * Wraps every protected staff route. Redirects to /staff/login when signed
 * out, shows an access-denied screen for a signed-in user without a
 * staff/admin role (e.g. a customer account), and renders children once
 * authorized.
 */
export function StaffGuard({ children }: { children: React.ReactNode }) {
  const session = useStaffSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session.status === "signed-out") {
      navigate({ to: "/staff/login" });
    }
  }, [session.status, navigate]);

  if (session.status === "loading" || session.status === "signed-out") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </div>
    );
  }

  if (session.status === "unauthorized") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your account doesn't have staff access to KIN Kitchen's order dashboard. If you think this
          is a mistake, contact an administrator.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => void signOutStaff()}>
            Sign out
          </Button>
          <Button asChild variant="secondary">
            <Link to="/">Back to site</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type SessionState =
  { status: "loading" } | { status: "signed-out" } | { status: "signed-in"; session: Session };

/**
 * Bare Supabase Auth session state — no role check. Any signed-in user is a
 * valid customer account (handle_new_user() in Stage 1's initial migration
 * always grants role='customer' on signup, unconditionally), so
 * customer-facing pages only need "is there a session," unlike
 * useStaffSession() in staff-auth.tsx which additionally requires a
 * staff/admin row in user_roles.
 */
export function useSupabaseSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setState(
        data.session ? { status: "signed-in", session: data.session } : { status: "signed-out" },
      );
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setState(session ? { status: "signed-in", session } : { status: "signed-out" });
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Wraps every protected /account/* page: redirects to /account/login when
 * signed out, renders children once a session exists. */
export function AccountGuard({ children }: { children: React.ReactNode }) {
  const session = useSupabaseSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session.status === "signed-out") {
      navigate({ to: "/account/login" });
    }
  }, [session.status, navigate]);

  if (session.status !== "signed-in") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </div>
    );
  }

  return <>{children}</>;
}

import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { signOutStaff, useStaffSession } from "@/lib/staff-auth";

/**
 * Wraps /admin/*. Built entirely on the existing useStaffSession() hook
 * (staff-auth.tsx, unmodified) — this is not a second auth system, just an
 * additional check on the role it already resolves:
 *   - no session -> redirect to /staff/login (same login page staff use)
 *   - signed in, not staff/admin -> useStaffSession() already reports
 *     "unauthorized" for this; treated the same as staff-only below
 *   - signed in as staff (not admin) -> explicit "Access denied", analytics
 *     is the first capability in this app that staff does not receive
 *   - signed in as admin -> render children
 *
 * This is a UX gate only. The real boundary is has_role(auth.uid(),'admin')
 * inside each of the six admin_* SQL functions — every one of them rejects
 * a non-admin caller regardless of what this component does.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
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
          Your account doesn't have staff access to KIN Kitchen.
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

  if (session.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Business analytics is only available to admin accounts. Your account has staff access,
          which doesn't include this page.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => void signOutStaff()}>
            Sign out
          </Button>
          <Button asChild variant="secondary">
            <Link to="/staff">Back to orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

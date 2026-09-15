import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminSectionShell({
  title,
  description,
  isPending,
  isError,
  error,
  isEmpty,
  emptyMessage = "No data for this range.",
  onRetry,
  children,
  skeletonHeight = "h-48",
}: {
  title: string;
  description?: string;
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry: () => void;
  children: React.ReactNode;
  skeletonHeight?: string;
}) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="mt-4">
        {isPending && <Skeleton className={`${skeletonHeight} w-full rounded-2xl`} />}

        {isError && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Something went wrong."}
            </p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        )}

        {!isPending && !isError && isEmpty && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <Inbox className="h-6 w-6" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        )}

        {!isPending && !isError && !isEmpty && children}
      </div>
    </section>
  );
}

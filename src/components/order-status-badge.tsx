import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/order-status";

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-secondary text-secondary-foreground border-transparent",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-accent/15 text-accent border-accent/30",
  },
  preparing: {
    label: "Preparing",
    className: "bg-accent/25 text-accent border-accent/40",
  },
  ready: {
    label: "Ready for pickup",
    className: "bg-success/15 text-success border-success/30",
  },
  out_for_delivery: {
    label: "Out for delivery",
    className: "bg-success/15 text-success border-success/30",
  },
  delivered: {
    label: "Delivered",
    className: "bg-success/20 text-success border-success/40",
  },
  completed: {
    label: "Completed",
    className: "bg-success/20 text-success border-success/40",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function orderStatusLabel(status: OrderStatus): string {
  return STATUS_META[status].label;
}

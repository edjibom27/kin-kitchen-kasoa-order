import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/lib/admin-auth";
import { StaffNav } from "@/components/staff-nav";
import { AdminDateRangePicker } from "@/components/admin/date-range-picker";
import { AdminOverviewCards } from "@/components/admin/overview-cards";
import { AdminRevenueChart } from "@/components/admin/revenue-chart";
import { AdminStatusBreakdown } from "@/components/admin/status-breakdown";
import { AdminBestSellingItems } from "@/components/admin/best-sellers";
import { AdminCategorySales } from "@/components/admin/category-sales";
import { AdminCustomerInsights } from "@/components/admin/customer-insights";
import { AdminRecentOrders } from "@/components/admin/recent-orders";
import { resolvePresetRange, type DateRange, type DateRangePreset } from "@/lib/admin-analytics";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — KIN Kitchen" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminDashboardPage />
    </AdminGuard>
  ),
});

function AdminDashboardPage() {
  const [preset, setPreset] = useState<DateRangePreset>("last7");
  const [range, setRange] = useState<DateRange>(() => resolvePresetRange("last7"));

  function handleRangeChange(nextPreset: DateRangePreset, nextRange: DateRange) {
    setPreset(nextPreset);
    setRange(nextRange);
  }

  return (
    <div className="min-h-screen bg-background">
      <StaffNav active="admin" />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Business performance and analytics for KIN Kitchen.
            </p>
          </div>
          <AdminDateRangePicker preset={preset} range={range} onChange={handleRangeChange} />
        </div>

        <div className="mt-6">
          <AdminOverviewCards range={range} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AdminRevenueChart range={range} />
          </div>
          <AdminStatusBreakdown range={range} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <AdminBestSellingItems range={range} />
          <AdminCategorySales range={range} />
        </div>

        <div className="mt-6">
          <AdminCustomerInsights range={range} />
        </div>

        <div className="mt-6">
          <AdminRecentOrders />
        </div>
      </div>
    </div>
  );
}

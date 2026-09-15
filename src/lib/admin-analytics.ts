import { queryOptions } from "@tanstack/react-query";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { OrderStatus } from "@/lib/order-status";

// ---------------------------------------------------------------------------
// Date range presets
// ---------------------------------------------------------------------------

export type DateRange = { start: Date; end: Date };

export type DateRangePreset =
  "today" | "yesterday" | "last7" | "last30" | "thisMonth" | "lastMonth" | "custom";

export const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "custom", label: "Custom range" },
];

/** Every preset except "custom", which needs a user-picked range instead. */
export function resolvePresetRange(preset: Exclude<DateRangePreset, "custom">): DateRange {
  const now = new Date();
  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday": {
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    case "last7":
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case "last30":
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
    case "thisMonth":
      return { start: startOfMonth(now), end: endOfDay(now) };
    case "lastMonth": {
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }
  }
}

// ---------------------------------------------------------------------------
// Result types (camelCase, mapped from the RPCs' snake_case columns)
// ---------------------------------------------------------------------------

export type DashboardOverview = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  registeredCustomers: number;
};

export type RevenuePoint = { bucketDate: string; revenue: number; orderCount: number };

export type StatusCount = { status: OrderStatus; orderCount: number };

export type BestSellingItem = { itemName: string; quantitySold: number; revenue: number };

export type CategorySales = { categoryName: string; revenue: number; quantitySold: number };

export type CustomerInsights = {
  totalCustomers: number;
  newCustomersInPeriod: number;
  customersWithOrders: number;
  returningCustomers: number;
  avgOrdersPerCustomer: number;
};

// ---------------------------------------------------------------------------
// RPC calls — every one of these is admin-only at the database level
// (see supabase/migrations/20260915000000_stage5_admin_analytics.sql).
// A rejection here always means "not an admin," never a data problem.
// ---------------------------------------------------------------------------

function toIso(date: Date): string {
  return date.toISOString();
}

function friendlyRpcError(error: { message: string }, what: string): Error {
  if (/UNAUTHORIZED/i.test(error.message)) {
    return new Error("You don't have permission to view this data.");
  }
  if (/INVALID_DATE_RANGE/i.test(error.message)) {
    return new Error("The selected date range is invalid.");
  }
  return new Error(`Failed to load ${what}: ${error.message}`);
}

export async function fetchDashboardOverview(range: DateRange): Promise<DashboardOverview> {
  const { data, error } = await supabase.rpc("admin_dashboard_overview", {
    p_start: toIso(range.start),
    p_end: toIso(range.end),
  });
  if (error) throw friendlyRpcError(error, "the dashboard overview");
  const row = data?.[0];
  return {
    totalRevenue: Number(row?.total_revenue ?? 0),
    totalOrders: Number(row?.total_orders ?? 0),
    averageOrderValue: Number(row?.average_order_value ?? 0),
    registeredCustomers: Number(row?.registered_customers ?? 0),
  };
}

export async function fetchRevenueSeries(range: DateRange): Promise<RevenuePoint[]> {
  const { data, error } = await supabase.rpc("admin_revenue_series", {
    p_start: toIso(range.start),
    p_end: toIso(range.end),
  });
  if (error) throw friendlyRpcError(error, "the revenue chart");
  return (data ?? []).map((row) => ({
    bucketDate: String(row.bucket_date),
    revenue: Number(row.revenue),
    orderCount: Number(row.order_count),
  }));
}

export async function fetchStatusCounts(range: DateRange): Promise<StatusCount[]> {
  const { data, error } = await supabase.rpc("admin_status_counts", {
    p_start: toIso(range.start),
    p_end: toIso(range.end),
  });
  if (error) throw friendlyRpcError(error, "the order status breakdown");
  return (data ?? []).map((row) => ({
    status: row.status as OrderStatus,
    orderCount: Number(row.order_count),
  }));
}

export async function fetchBestSellingItems(
  range: DateRange,
  limit = 10,
): Promise<BestSellingItem[]> {
  const { data, error } = await supabase.rpc("admin_best_selling_items", {
    p_start: toIso(range.start),
    p_end: toIso(range.end),
    p_limit: limit,
  });
  if (error) throw friendlyRpcError(error, "best-selling items");
  return (data ?? []).map((row) => ({
    itemName: row.item_name,
    quantitySold: Number(row.quantity_sold),
    revenue: Number(row.revenue),
  }));
}

export async function fetchCategorySales(range: DateRange): Promise<CategorySales[]> {
  const { data, error } = await supabase.rpc("admin_category_sales", {
    p_start: toIso(range.start),
    p_end: toIso(range.end),
  });
  if (error) throw friendlyRpcError(error, "sales by category");
  return (data ?? []).map((row) => ({
    categoryName: row.category_name,
    revenue: Number(row.revenue),
    quantitySold: Number(row.quantity_sold),
  }));
}

export async function fetchCustomerInsights(range: DateRange): Promise<CustomerInsights> {
  const { data, error } = await supabase.rpc("admin_customer_insights", {
    p_start: toIso(range.start),
    p_end: toIso(range.end),
  });
  if (error) throw friendlyRpcError(error, "customer insights");
  const row = data?.[0];
  return {
    totalCustomers: Number(row?.total_customers ?? 0),
    newCustomersInPeriod: Number(row?.new_customers_in_period ?? 0),
    customersWithOrders: Number(row?.customers_with_orders ?? 0),
    returningCustomers: Number(row?.returning_customers ?? 0),
    avgOrdersPerCustomer: Number(row?.avg_orders_per_customer ?? 0),
  };
}

// ---------------------------------------------------------------------------
// React Query option factories — one per section, so each can independently
// show its own loading/empty/error state (see the dashboard route).
// ---------------------------------------------------------------------------

const rangeKey = (range: DateRange) => [range.start.toISOString(), range.end.toISOString()];

export const dashboardOverviewQueryOptions = (range: DateRange) =>
  queryOptions({
    queryKey: ["admin-overview", ...rangeKey(range)],
    queryFn: () => fetchDashboardOverview(range),
  });

export const revenueSeriesQueryOptions = (range: DateRange) =>
  queryOptions({
    queryKey: ["admin-revenue-series", ...rangeKey(range)],
    queryFn: () => fetchRevenueSeries(range),
  });

export const statusCountsQueryOptions = (range: DateRange) =>
  queryOptions({
    queryKey: ["admin-status-counts", ...rangeKey(range)],
    queryFn: () => fetchStatusCounts(range),
  });

export const bestSellingItemsQueryOptions = (range: DateRange, limit = 10) =>
  queryOptions({
    queryKey: ["admin-best-sellers", ...rangeKey(range), limit],
    queryFn: () => fetchBestSellingItems(range, limit),
  });

export const categorySalesQueryOptions = (range: DateRange) =>
  queryOptions({
    queryKey: ["admin-category-sales", ...rangeKey(range)],
    queryFn: () => fetchCategorySales(range),
  });

export const customerInsightsQueryOptions = (range: DateRange) =>
  queryOptions({
    queryKey: ["admin-customer-insights", ...rangeKey(range)],
    queryFn: () => fetchCustomerInsights(range),
  });

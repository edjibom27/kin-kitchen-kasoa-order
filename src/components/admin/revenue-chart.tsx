import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AdminSectionShell } from "@/components/admin/section-shell";
import { formatCedis } from "@/lib/menu-data";
import { revenueSeriesQueryOptions, type DateRange } from "@/lib/admin-analytics";

const chartConfig = {
  revenue: { label: "Revenue (GH₵)", color: "var(--accent)" },
  orderCount: { label: "Orders", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

export function AdminRevenueChart({ range }: { range: DateRange }) {
  const queryClient = useQueryClient();
  const options = revenueSeriesQueryOptions(range);
  const { data, isPending, isError, error } = useQuery(options);

  const chartData = (data ?? []).map((point) => ({
    date: point.bucketDate,
    revenue: point.revenue,
    orderCount: point.orderCount,
  }));
  const hasAnyRevenue = chartData.some((d) => d.revenue > 0 || d.orderCount > 0);

  return (
    <AdminSectionShell
      title="Revenue over time"
      description="Delivered and completed orders, by day"
      isPending={isPending}
      isError={isError}
      error={error}
      isEmpty={!isPending && !isError && !hasAnyRevenue}
      emptyMessage="No revenue in this range yet."
      onRetry={() => void queryClient.invalidateQueries({ queryKey: options.queryKey })}
      skeletonHeight="h-72"
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
        <ComposedChart data={chartData} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value: string) => format(parseISO(value), "d MMM")}
          />
          <YAxis
            yAxisId="revenue"
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => formatCedis(value)}
          />
          <YAxis yAxisId="orders" orientation="right" hide />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value: string) => format(parseISO(value), "d MMM yyyy")}
                formatter={(value, name) => [
                  name === "revenue" ? formatCedis(Number(value)) : value,
                  name === "revenue" ? "Revenue" : "Orders",
                ]}
              />
            }
          />
          <Bar
            yAxisId="orders"
            dataKey="orderCount"
            fill="var(--color-orderCount)"
            radius={4}
            barSize={18}
            opacity={0.35}
          />
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-revenue)"
            fill="var(--color-revenue)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </ComposedChart>
      </ChartContainer>
    </AdminSectionShell>
  );
}

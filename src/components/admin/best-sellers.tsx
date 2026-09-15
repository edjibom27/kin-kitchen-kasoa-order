import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminSectionShell } from "@/components/admin/section-shell";
import { formatCedis } from "@/lib/menu-data";
import { bestSellingItemsQueryOptions, type DateRange } from "@/lib/admin-analytics";

export function AdminBestSellingItems({ range }: { range: DateRange }) {
  const queryClient = useQueryClient();
  const options = bestSellingItemsQueryOptions(range, 10);
  const { data, isPending, isError, error } = useQuery(options);
  const items = data ?? [];

  return (
    <AdminSectionShell
      title="Best-selling items"
      description="Top 10, delivered + completed orders"
      isPending={isPending}
      isError={isError}
      error={error}
      isEmpty={!isPending && !isError && items.length === 0}
      emptyMessage="No items sold in this range yet."
      onRetry={() => void queryClient.invalidateQueries({ queryKey: options.queryKey })}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty sold</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.itemName}>
                <TableCell className="font-medium">{item.itemName}</TableCell>
                <TableCell className="text-right tabular-nums">{item.quantitySold}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCedis(item.revenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminSectionShell>
  );
}

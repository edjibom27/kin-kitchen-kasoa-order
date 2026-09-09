import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, Pencil, Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StaffGuard, useStaffSession } from "@/lib/staff-auth";
import { StaffNav } from "@/components/staff-nav";
import { formatCedis } from "@/lib/menu-data";
import {
  staffMenuItemsQueryOptions,
  staffCategoriesQueryOptions,
  updateMenuItem,
  deleteMenuItem,
  deleteCategory,
  type StaffMenuItem,
  type StaffCategory,
} from "@/lib/staff-menu";
import { MenuItemDialog } from "@/components/staff/menu-item-dialog";
import { CategoryDialog } from "@/components/staff/category-dialog";

export const Route = createFileRoute("/staff/menu")({
  head: () => ({
    meta: [{ title: "Menu Management — KIN Kitchen Staff" }],
  }),
  component: () => (
    <StaffGuard>
      <StaffMenuPage />
    </StaffGuard>
  ),
});

type AvailabilityFilter = "all" | "available" | "unavailable";

function StaffMenuPage() {
  const session = useStaffSession();
  const isAdmin = session.status === "authorized" && session.role === "admin";
  const queryClient = useQueryClient();

  const {
    data: categories,
    isPending: categoriesPending,
    isError: categoriesError,
    error: categoriesErr,
    refetch: refetchCategories,
  } = useQuery(staffCategoriesQueryOptions());

  const {
    data: items,
    isPending: itemsPending,
    isError: itemsError,
    error: itemsErr,
    refetch: refetchItems,
  } = useQuery(staffMenuItemsQueryOptions());

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StaffMenuItem | null>(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<StaffMenuItem | null>(null);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StaffCategory | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<StaffCategory | null>(null);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories ?? []) map.set(c.id, c.name);
    return map;
  }, [categories]);

  const itemCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items ?? []) {
      counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (items ?? []).filter((item) => {
      if (categoryFilter !== "all" && item.category_id !== categoryFilter) return false;
      if (availabilityFilter === "available" && !item.is_available) return false;
      if (availabilityFilter === "unavailable" && item.is_available) return false;
      if (query && !item.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [items, categoryFilter, availabilityFilter, search]);

  function invalidateAll() {
    // Staff-facing caches, plus the customer-facing ones — invalidating both
    // means the change shows up immediately if the same browser session
    // also has a customer tab open, without waiting out their staleTime.
    void queryClient.invalidateQueries({ queryKey: ["staff-menu-items"] });
    void queryClient.invalidateQueries({ queryKey: ["staff-categories"] });
    void queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
  }

  async function handleToggleAvailability(item: StaffMenuItem) {
    try {
      await updateMenuItem(item.id, { is_available: !item.is_available });
      toast.success(`${item.name} marked ${item.is_available ? "unavailable" : "available"}`);
      invalidateAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update availability.");
    }
  }

  async function handleDeleteItem() {
    if (!deleteItemTarget) return;
    const target = deleteItemTarget;
    try {
      await deleteMenuItem(target.id);
      toast.success(`${target.name} deleted`);
      invalidateAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete this item.");
    } finally {
      setDeleteItemTarget(null);
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCategoryTarget) return;
    const target = deleteCategoryTarget;
    try {
      await deleteCategory(target.id);
      toast.success(`${target.name} deleted`);
      invalidateAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete this category.");
    } finally {
      setDeleteCategoryTarget(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <StaffNav active="menu" />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes here are live on the customer menu as soon as they save.
        </p>

        {/* Categories */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Categories</h2>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Add category
              </Button>
            )}
          </div>

          {categoriesPending && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          )}

          {categoriesError && (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p className="text-sm text-destructive">
                {categoriesErr instanceof Error
                  ? categoriesErr.message
                  : "Couldn't load categories."}
              </p>
              <Button variant="outline" size="sm" onClick={() => void refetchCategories()}>
                Try again
              </Button>
            </div>
          )}

          {!categoriesPending && !categoriesError && categories?.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">No categories yet.</p>
          )}

          {!categoriesPending && !categoriesError && (categories?.length ?? 0) > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories?.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {itemCountByCategory.get(cat.id) ?? 0} item
                      {itemCountByCategory.get(cat.id) === 1 ? "" : "s"}
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteCategoryTarget(cat)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Menu items */}
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Menu items</h2>
            <Button
              size="sm"
              variant="hero"
              onClick={() => {
                setEditingItem(null);
                setItemDialogOpen(true);
              }}
              disabled={(categories?.length ?? 0) === 0}
            >
              <Plus className="h-4 w-4" /> Add item
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={availabilityFilter}
              onValueChange={(v) => setAvailabilityFilter(v as AvailabilityFilter)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All items</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 grid gap-4">
            {itemsPending && (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-3xl" />
                ))}
              </>
            )}

            {itemsError && (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-10 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="font-medium text-destructive">Couldn't load menu items</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {itemsErr instanceof Error ? itemsErr.message : "Please try again."}
                </p>
                <Button variant="outline" size="sm" onClick={() => void refetchItems()}>
                  Try again
                </Button>
              </div>
            )}

            {!itemsPending && !itemsError && filteredItems.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground">
                <UtensilsCrossed className="h-8 w-8" />
                <p className="font-medium text-foreground">No items match</p>
                <p className="text-sm">
                  {items && items.length > 0
                    ? "Try a different search or filter."
                    : "Add your first menu item to get started."}
                </p>
              </div>
            )}

            {!itemsPending &&
              !itemsError &&
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-semibold">{item.name}</span>
                        {item.is_featured && (
                          <Badge className="bg-accent/15 text-accent">Featured</Badge>
                        )}
                        {!item.is_available && <Badge variant="secondary">Unavailable</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {categoryNameById.get(item.category_id) ?? "Uncategorized"} ·{" "}
                        {formatCedis(Number(item.price))}
                      </p>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                      Available
                      <Switch
                        checked={item.is_available}
                        onCheckedChange={() => void handleToggleAvailability(item)}
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingItem(item);
                        setItemDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteItemTarget(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>

      <MenuItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={editingItem}
        categories={categories ?? []}
        onSaved={invalidateAll}
      />
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
        onSaved={invalidateAll}
      />

      <AlertDialog
        open={Boolean(deleteItemTarget)}
        onOpenChange={(open) => !open && setDeleteItemTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteItemTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the item from the menu permanently. Past orders that included it are
              unaffected — order history keeps its own copy of the item name and price.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDeleteItem()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteCategoryTarget)}
        onOpenChange={(open) => !open && setDeleteCategoryTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteCategoryTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCategoryTarget && (itemCountByCategory.get(deleteCategoryTarget.id) ?? 0) > 0
                ? `This category still has ${itemCountByCategory.get(deleteCategoryTarget.id)} menu item(s) assigned to it. Move or delete those items first — the database won't allow this deletion until then.`
                : "This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDeleteCategory()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

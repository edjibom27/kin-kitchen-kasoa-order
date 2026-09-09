import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, updateCategory, type StaffCategory } from "@/lib/staff-menu";

const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(60),
  sortOrder: z.coerce.number({ invalid_type_error: "Enter a whole number" }).int(),
});

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: StaffCategory | null;
  onSaved: () => void;
}) {
  const isEditing = Boolean(category);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setSortOrder(category ? String(category.sort_order) : "0");
    setErrors({});
  }, [open, category]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = categoryFormSchema.safeParse({ name, sortOrder });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    const data = parsed.data;

    try {
      if (isEditing && category) {
        await updateCategory(category.id, { name: data.name, sort_order: data.sortOrder });
        toast.success(`${data.name} updated`);
      } else {
        await createCategory({ name: data.name, sort_order: data.sortOrder });
        toast.success(`${data.name} added`);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit category" : "Add category"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Rename this category or change its position in the menu."
              : "Categories group dishes on the customer menu."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
            {errors["name"] && <p className="text-xs text-destructive">{errors["name"]}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category-sort">Position</Label>
            <Input
              id="category-sort"
              type="number"
              step="1"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first on the customer menu.
            </p>
            {errors["sortOrder"] && (
              <p className="text-xs text-destructive">{errors["sortOrder"]}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" disabled={submitting}>
              {submitting ? "Saving…" : isEditing ? "Save changes" : "Add category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

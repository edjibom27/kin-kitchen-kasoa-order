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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createMenuItem,
  updateMenuItem,
  type StaffCategory,
  type StaffMenuItem,
} from "@/lib/staff-menu";
import { IMAGE_KEYS } from "@/lib/menu-data";

// Client-side validation only exists for instant UX feedback — the real
// security boundary is RLS on menu_items (see the Stage 3 migration): only
// a staff/admin session can ever get past createMenuItem()/updateMenuItem().
const menuItemFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  description: z.string().trim().max(500),
  price: z.coerce
    .number({ invalid_type_error: "Enter a valid price" })
    .min(0, "Price must be zero or greater"),
  categoryId: z.string().uuid("Choose a category"),
  imageKey: z.string().min(1, "Choose an image"),
  isAvailable: z.boolean(),
  isFeatured: z.boolean(),
});

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "item"}-${suffix}`;
}

export function MenuItemDialog({
  open,
  onOpenChange,
  item,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StaffMenuItem | null;
  categories: StaffCategory[];
  onSaved: () => void;
}) {
  const isEditing = Boolean(item);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageKey, setImageKey] = useState<string>(IMAGE_KEYS[0] ?? "jollof");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setDescription(item?.description ?? "");
    setPrice(item ? String(item.price) : "");
    setCategoryId(item?.category_id ?? categories[0]?.id ?? "");
    setImageKey(item?.image_key ?? IMAGE_KEYS[0] ?? "jollof");
    setIsAvailable(item?.is_available ?? true);
    setIsFeatured(item?.is_featured ?? false);
    setErrors({});
  }, [open, item, categories]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = menuItemFormSchema.safeParse({
      name,
      description,
      price,
      categoryId,
      imageKey,
      isAvailable,
      isFeatured,
    });

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
      if (isEditing && item) {
        await updateMenuItem(item.id, {
          name: data.name,
          description: data.description,
          price: data.price,
          category_id: data.categoryId,
          image_key: data.imageKey,
          is_available: data.isAvailable,
          is_featured: data.isFeatured,
        });
        toast.success(`${data.name} updated`);
      } else {
        await createMenuItem({
          slug: slugify(data.name),
          name: data.name,
          description: data.description,
          price: data.price,
          category_id: data.categoryId,
          image_key: data.imageKey,
          is_available: data.isAvailable,
          is_featured: data.isFeatured,
        });
        toast.success(`${data.name} added to the menu`);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit menu item" : "Add menu item"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update this dish's details." : "Add a new dish to the KIN Kitchen menu."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
            />
            {errors["name"] && <p className="text-xs text-destructive">{errors["name"]}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="item-description">Description</Label>
            <Textarea
              id="item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="item-price">Price (GH₵)</Label>
              <Input
                id="item-price"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              {errors["price"] && <p className="text-xs text-destructive">{errors["price"]}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors["categoryId"] && (
                <p className="text-xs text-destructive">{errors["categoryId"]}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Image</Label>
            <Select value={imageKey} onValueChange={setImageKey}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <Label htmlFor="item-available" className="cursor-pointer">
              Available to order
            </Label>
            <Switch id="item-available" checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <Label htmlFor="item-featured" className="cursor-pointer">
              Featured on homepage
            </Label>
            <Switch id="item-featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" disabled={submitting}>
              {submitting ? "Saving…" : isEditing ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

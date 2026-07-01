"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import apiClient from "@/lib/api-client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/types";

// ─── Categories ───────────────────────────────────────────────────────────────

export const PRODUCT_CATEGORIES = [
  "Electrotherapy",
  "Exercise & Rehab Equipment",
  "Traction Units",
  "Ultrasound Therapy",
  "Cryotherapy",
  "Laser Therapy",
  "Orthopedic Supports",
  "Other",
] as const;

export const PRODUCT_UNITS = ["piece", "set", "kit", "pair", "box", "container"] as const;

// ─── Schema ───────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name:                z.string().min(1, "Name is required").max(255),
  sku:                 z.string().min(1, "SKU is required").max(100),
  category:            z.string().min(1, "Category is required"),
  description:         z.string().optional(),
  price:               z.coerce.number({ invalid_type_error: "Price must be a number" }).min(0, "Price must be ≥ 0"),
  stock_quantity:      z.coerce.number({ invalid_type_error: "Must be a number" }).int().min(0, "Stock must be ≥ 0"),
  low_stock_threshold: z.coerce.number({ invalid_type_error: "Must be a number" }).int().min(0, "Threshold must be ≥ 0"),
  unit:                z.string().min(1, "Unit is required"),
  image_url:           z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProductFormData = z.infer<typeof productSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a product to edit; undefined = create mode */
  product?: Product;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const isEdit = !!product;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "",
      description: "",
      price: 0,
      stock_quantity: 0,
      low_stock_threshold: 10,
      unit: "piece",
      image_url: "",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (product) {
        reset({
          name: product.name,
          sku: product.sku,
          category: product.category,
          description: product.description ?? "",
          price: Number(product.price),
          stock_quantity: product.stock_quantity,
          low_stock_threshold: product.low_stock_threshold,
          unit: product.unit,
          image_url: product.image_url ?? "",
        });
      } else {
        reset({
          name: "", sku: "", category: "", description: "",
          price: 0, stock_quantity: 0, low_stock_threshold: 10,
          unit: "piece", image_url: "",
        });
      }
    }
  }, [open, product, reset]);

  const mutation = useMutation({
    mutationFn: (data: ProductFormData) => {
      const payload = {
        ...data,
        description: data.description || null,
        image_url: data.image_url || null,
      };
      return isEdit
        ? apiClient.put<Product>(`/products/${product!.id}`, payload).then((r) => r.data)
        : apiClient.post<Product>("/products", payload).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(isEdit ? "Product updated successfully." : "Product created successfully.");
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message ?? err.message ?? "Something went wrong.";
      toast.error(msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the product details below." : "Fill in the details for the new product."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input id="name" {...register("name")} placeholder="Product name" />
              <FieldError message={errors.name?.message} />
            </div>

            {/* SKU */}
            <div className="space-y-1">
              <Label htmlFor="sku">SKU <span className="text-destructive">*</span></Label>
              <Input id="sku" {...register("sku")} placeholder="e.g. ELEC-001" />
              <FieldError message={errors.sku?.message} />
            </div>

            {/* Unit */}
            <div className="space-y-1">
              <Label>Unit <span className="text-destructive">*</span></Label>
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                    <SelectContent>
                      {PRODUCT_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.unit?.message} />
            </div>

            {/* Category */}
            <div className="col-span-2 space-y-1">
              <Label>Category <span className="text-destructive">*</span></Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.category?.message} />
            </div>

            {/* Price */}
            <div className="space-y-1">
              <Label htmlFor="price">Price (₹) <span className="text-destructive">*</span></Label>
              <Input id="price" type="number" step="0.01" min="0" {...register("price")} />
              <FieldError message={errors.price?.message} />
            </div>

            {/* Stock quantity */}
            <div className="space-y-1">
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <Input id="stock_quantity" type="number" min="0" {...register("stock_quantity")} />
              <FieldError message={errors.stock_quantity?.message} />
            </div>

            {/* Low stock threshold */}
            <div className="space-y-1">
              <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
              <Input id="low_stock_threshold" type="number" min="0" {...register("low_stock_threshold")} />
              <FieldError message={errors.low_stock_threshold?.message} />
            </div>

            {/* Image URL */}
            <div className="space-y-1">
              <Label htmlFor="image_url">Image URL</Label>
              <Input id="image_url" {...register("image_url")} placeholder="https://..." />
              <FieldError message={errors.image_url?.message} />
            </div>

            {/* Description */}
            <div className="col-span-2 space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Product description…"
                rows={3}
              />
              <FieldError message={errors.description?.message} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

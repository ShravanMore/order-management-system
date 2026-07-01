"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

import apiClient from "@/lib/api-client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const adjustSchema = z.object({
  delta: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .int("Must be a whole number")
    .refine((v) => v !== 0, "Adjustment cannot be zero"),
  reason: z.string().optional(),
});

type AdjustFormData = z.infer<typeof adjustSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdjustStockDialog({ open, onOpenChange, product }: AdjustStockDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AdjustFormData>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { delta: 0, reason: "" },
  });

  const delta = watch("delta");
  const newStock = (product.stock_quantity ?? 0) + (Number(delta) || 0);

  useEffect(() => {
    if (open) reset({ delta: 0, reason: "" });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (data: AdjustFormData) =>
      apiClient
        .patch<Product>(`/products/${product.id}/stock`, { delta: data.delta })
        .then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(
        `Stock updated: ${product.name} is now ${updated.stock_quantity} ${updated.unit}(s).`
      );
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message ?? err.message ?? "Stock adjustment failed.";
      toast.error(msg);
    },
  });

  const isPositive = Number(delta) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription className="truncate">
            {product.name} — Current: <strong>{product.stock_quantity} {product.unit}(s)</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {/* Delta */}
          <div className="space-y-1">
            <Label htmlFor="delta">
              Adjustment{" "}
              <span className="text-xs text-muted-foreground">(positive = add, negative = remove)</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="delta"
                type="number"
                {...register("delta")}
                className="text-center font-mono"
                placeholder="e.g. 10 or -5"
              />
              {Number(delta) !== 0 && (
                isPositive
                  ? <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
                  : <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
              )}
            </div>
            {errors.delta && (
              <p className="text-xs text-destructive">{errors.delta.message}</p>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-md bg-muted px-3 py-2 text-sm flex justify-between">
            <span className="text-muted-foreground">New stock level</span>
            <span className={`font-semibold tabular-nums ${newStock < 0 ? "text-destructive" : ""}`}>
              {newStock} {product.unit}(s)
            </span>
          </div>

          {/* Reason (optional) */}
          <div className="space-y-1">
            <Label htmlFor="reason">Reason <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Input id="reason" {...register("reason")} placeholder="e.g. Received shipment" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || newStock < 0}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

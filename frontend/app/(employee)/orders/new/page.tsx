"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus, Trash2, CalendarIcon, Loader2, Package, Search,
} from "lucide-react";

import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Dealer, Product, Order } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DealerListResponse  { items: Dealer[];  total_count: number; }
interface ProductListResponse { items: Product[]; total_count: number; }

interface LineItem {
  product: Product;
  quantity: number;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  dealer_id:              z.number({ required_error: "Select a dealer" }).min(1, "Select a dealer"),
  order_date:             z.date({ required_error: "Order date is required" }),
  expected_delivery_date: z.date().optional(),
  notes:                  z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(v));
}

// ─── Dealer combobox ─────────────────────────────────────────────────────────

function DealerCombobox({
  value, onChange,
}: { value?: number; onChange: (id: number, name: string) => void }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["dealers-search", search],
    queryFn: () => {
      const p = new URLSearchParams({ page: "1", page_size: "20" });
      if (search) p.set("name", search);
      return apiClient.get<DealerListResponse>(`/dealers?${p}`).then((r) => r.data);
    },
    staleTime: 30_000,
  });

  const selected = data?.items.find((d) => d.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal h-9">
          {selected ? selected.name : <span className="text-muted-foreground">Search dealer…</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-2" align="start">
        <div className="flex items-center gap-2 pb-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Type to search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Separator className="mb-1" />
        <div className="max-h-56 overflow-y-auto space-y-0.5">
          {(data?.items ?? []).length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No dealers found.</p>
          )}
          {(data?.items ?? []).map((d) => (
            <button
              key={d.id}
              type="button"
              className={cn(
                "w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent",
                value === d.id && "bg-accent font-medium"
              )}
              onClick={() => { onChange(d.id, d.name); setOpen(false); setSearch(""); }}
            >
              <p className="font-medium">{d.name}</p>
              <p className="text-xs text-muted-foreground">{d.city}, {d.state}</p>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Product search combobox ─────────────────────────────────────────────────

function ProductSearch({ onSelect }: { onSelect: (p: Product) => void }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["products-search", search],
    queryFn: () => {
      const p = new URLSearchParams({ page: "1", page_size: "20" });
      if (search) p.set("name", search);
      return apiClient.get<ProductListResponse>(`/products?${p}`).then((r) => r.data);
    },
    staleTime: 30_000,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Product
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-2" align="start">
        <div className="flex items-center gap-2 pb-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Separator className="mb-1" />
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {(data?.items ?? []).length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No products found.</p>
          )}
          {(data?.items ?? []).map((p) => {
            const isLow = p.stock_quantity <= p.low_stock_threshold;
            return (
              <button
                key={p.id}
                type="button"
                disabled={p.stock_quantity === 0}
                className={cn(
                  "w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                onClick={() => { onSelect(p); setOpen(false); setSearch(""); }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku} · {fmt(p.price)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("text-xs font-medium", isLow ? "text-red-500" : "text-muted-foreground")}>
                      {p.stock_quantity} {p.unit}(s)
                    </p>
                    {p.stock_quantity === 0 && (
                      <p className="text-xs text-destructive">Out of stock</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Line item card ───────────────────────────────────────────────────────────

function LineItemCard({
  item, index, onChange, onRemove,
}: {
  item: LineItem;
  index: number;
  onChange: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
}) {
  const subtotal = Number(item.product.price) * item.quantity;
  const maxQty   = item.product.stock_quantity;
  const isOver   = item.quantity > maxQty;

  return (
    <div className="rounded-md border bg-card p-3 space-y-2">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{item.product.name}</p>
            <p className="text-xs text-muted-foreground">{item.product.sku} · {fmt(item.product.price)} / {item.product.unit}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Qty + subtotal row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground shrink-0">Qty</Label>
          <Input
            type="number"
            min={1}
            max={maxQty}
            value={item.quantity}
            onChange={(e) => onChange(index, Math.max(1, Number(e.target.value)))}
            className={cn("h-7 w-20 text-center text-sm", isOver && "border-destructive")}
          />
          <span className="text-xs text-muted-foreground">/ {maxQty} avail.</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">{fmt(subtotal)}</p>
          {isOver && (
            <p className="text-xs text-destructive">Exceeds stock</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewOrderPage() {
  const router = useRouter();
  const [lineItems, setLineItems]     = useState<LineItem[]>([]);
  const [orderDateOpen, setOrderDateOpen]    = useState(false);
  const [deliveryDateOpen, setDeliveryDateOpen] = useState(false);

  const {
    control, handleSubmit, watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const orderDate = watch("order_date");

  // ── Line item handlers ────────────────────────────────────────────────────

  const addProduct = useCallback((product: Product) => {
    setLineItems((prev) => {
      const existing = prev.findIndex((i) => i.product.id === product.id);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing].quantity = Math.min(
          updated[existing].quantity + 1,
          product.stock_quantity
        );
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQty = useCallback((index: number, qty: number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: qty };
      return updated;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Total ─────────────────────────────────────────────────────────────────

  const totalAmount = lineItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity, 0
  );

  const hasStockError = lineItems.some(
    (item) => item.quantity > item.product.stock_quantity
  );

  // ── Mutation ──────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      apiClient.post<Order>("/orders", {
        dealer_id:              data.dealer_id,
        order_date:             data.order_date.toISOString(),
        expected_delivery_date: data.expected_delivery_date?.toISOString() ?? null,
        notes:                  data.notes ?? null,
        items:                  lineItems.map((i) => ({
          product_id: i.product.id,
          quantity:   i.quantity,
        })),
      }).then((r) => r.data),
    onSuccess: (order) => {
      toast.success(`Order ${order.order_number} created successfully.`);
      router.push(`/orders/${order.id}`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message ?? err.message ?? "Failed to create order.";
      toast.error(msg);
    },
  });

  function onSubmit(data: FormData) {
    if (lineItems.length === 0) {
      toast.error("Add at least one product to the order.");
      return;
    }
    if (hasStockError) {
      toast.error("Some quantities exceed available stock.");
      return;
    }
    mutation.mutate(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New Order</h2>
        <p className="text-sm text-muted-foreground">Fill in the details below to create a new order.</p>
      </div>

      {/* ── Order details card ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Dealer */}
          <div className="space-y-1">
            <Label>Dealer <span className="text-destructive">*</span></Label>
            <Controller
              control={control}
              name="dealer_id"
              render={({ field }) => (
                <DealerCombobox
                  value={field.value}
                  onChange={(id) => field.onChange(id)}
                />
              )}
            />
            {errors.dealer_id && (
              <p className="text-xs text-destructive">{errors.dealer_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Order date */}
            <div className="space-y-1">
              <Label>Order Date <span className="text-destructive">*</span></Label>
              <Controller
                control={control}
                name="order_date"
                render={({ field }) => (
                  <Popover open={orderDateOpen} onOpenChange={setOrderDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start font-normal h-9", !field.value && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "dd MMM yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(d) => { field.onChange(d); setOrderDateOpen(false); }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.order_date && (
                <p className="text-xs text-destructive">{errors.order_date.message}</p>
              )}
            </div>

            {/* Expected delivery */}
            <div className="space-y-1">
              <Label>Expected Delivery <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Controller
                control={control}
                name="expected_delivery_date"
                render={({ field }) => (
                  <Popover open={deliveryDateOpen} onOpenChange={setDeliveryDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start font-normal h-9", !field.value && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "dd MMM yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        disabled={(d) => orderDate ? d < orderDate : false}
                        onSelect={(d) => { field.onChange(d); setDeliveryDateOpen(false); }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label>Notes <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <Textarea {...field} placeholder="Any special instructions…" rows={2} />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Line items card ────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Products
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({lineItems.length} item{lineItems.length !== 1 ? "s" : ""})
            </span>
          </CardTitle>
          <ProductSearch onSelect={addProduct} />
        </CardHeader>
        <CardContent className="space-y-3">
          {lineItems.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Package className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No products added yet. Click "Add Product" to get started.
              </p>
            </div>
          )}

          {lineItems.map((item, index) => (
            <LineItemCard
              key={item.product.id}
              item={item}
              index={index}
              onChange={updateQty}
              onRemove={removeItem}
            />
          ))}

          {lineItems.length > 0 && (
            <>
              <Separator />
              <div className="flex justify-end">
                <div className="text-right space-y-0.5">
                  <p className="text-sm text-muted-foreground">Order Total</p>
                  <p className="text-xl font-bold tabular-nums">{fmt(totalAmount)}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Submit ─────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending || lineItems.length === 0 || hasStockError}
        >
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Order
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  X, Package, Loader2, Calendar as CalendarIcon, CheckCircle2, Circle,
  User, Edit2, Save, XCircle,
} from "lucide-react";

import apiClient from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { StatusBadge, nextStatuses } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { OrderDetail, OrderStatus, User as UserType, Dealer, Product } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderDetailModalProps {
  orderId: number | null;
  onClose: () => void;
}

interface EmployeeListResponse {
  items: UserType[];
  total_count: number;
}

interface DealerListResponse {
  items: Dealer[];
  total_count: number;
}

// ─── Edit schema ──────────────────────────────────────────────────────────────

const editSchema = z.object({
  dealer_id: z.number().min(1),
  assigned_to_id: z.number().optional(),
  order_date: z.date(),
  expected_delivery_date: z.date().optional(),
  notes: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(v));
}

function fmtDate(iso: string) {
  return format(new Date(iso), "dd MMM yyyy, h:mm a");
}

// ─── Status timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ logs }: { logs: OrderDetail["status_logs"] }) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No status changes recorded yet.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-border ml-2 space-y-4">
      {[...logs].reverse().map((log, i) => (
        <li key={log.id} className="ml-5">
          <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full border bg-background">
            {i === 0 ? (
              <CheckCircle2 className="h-3 w-3 text-primary" />
            ) : (
              <Circle className="h-2.5 w-2.5 text-muted-foreground" />
            )}
          </span>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={log.new_status as OrderStatus} />
              {log.old_status && (
                <span className="text-xs text-muted-foreground">
                  from <StatusBadge status={log.old_status as OrderStatus} />
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              by <span className="font-medium text-foreground">{log.changed_by_name}</span>
              {" · "}
              {fmtDate(log.created_at)}
            </p>
            {log.remarks && (
              <p className="text-xs text-muted-foreground italic">"{log.remarks}"</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

// ─── Status update panel ──────────────────────────────────────────────────────

function StatusUpdatePanel({
  orderId,
  current,
}: {
  orderId: number;
  current: OrderStatus;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<OrderStatus | "">("");
  const [remarks, setRemarks] = useState("");

  const valid = nextStatuses(current);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient
        .patch(`/orders/${orderId}/status`, {
          status: selected,
          remarks: remarks || null,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated.");
      setSelected("");
      setRemarks("");
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.detail?.message ?? "Failed to update status.";
      toast.error(msg);
    },
  });

  if (valid.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        This order has reached a terminal status and cannot be updated further.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Move to</Label>
        <Select
          value={selected}
          onValueChange={(v) => setSelected(v as OrderStatus)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select new status…" />
          </SelectTrigger>
          <SelectContent>
            {valid.map((s) => (
              <SelectItem key={s} value={s}>
                <StatusBadge status={s} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">
          Remarks <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Reason for status change…"
          rows={2}
        />
      </div>

      <Button
        size="sm"
        disabled={!selected || mutation.isPending}
        onClick={() => mutation.mutate()}
        className="w-full"
      >
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Status
      </Button>
    </div>
  );
}

// ─── Main modal component ─────────────────────────────────────────────────────

export function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [orderDateOpen, setOrderDateOpen] = useState(false);
  const [deliveryDateOpen, setDeliveryDateOpen] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () =>
      apiClient.get<OrderDetail>(`/orders/${orderId}`).then((r) => r.data),
    enabled: orderId !== null,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees-list"],
    queryFn: () =>
      apiClient
        .get<EmployeeListResponse>("/employees?page=1&page_size=50")
        .then((r) => r.data),
    staleTime: 60_000,
    enabled: isAdmin,
  });

  const { data: dealers } = useQuery({
    queryKey: ["dealers-list"],
    queryFn: () =>
      apiClient
        .get<DealerListResponse>("/dealers?page=1&page_size=100")
        .then((r) => r.data),
    staleTime: 60_000,
    enabled: isAdmin && isEditing,
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  const orderDate = watch("order_date");

  // Reset form when order loads or editing starts
  useEffect(() => {
    if (order && isEditing) {
      reset({
        dealer_id: order.dealer_id,
        assigned_to_id: order.assigned_to_id ?? undefined,
        order_date: new Date(order.order_date),
        expected_delivery_date: order.expected_delivery_date
          ? new Date(order.expected_delivery_date)
          : undefined,
        notes: order.notes ?? undefined,
      });
    }
  }, [order, isEditing, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) =>
      apiClient
        .put(`/orders/${orderId}`, {
          dealer_id: data.dealer_id,
          assigned_to_id: data.assigned_to_id ?? null,
          order_date: data.order_date.toISOString(),
          expected_delivery_date: data.expected_delivery_date?.toISOString() ?? null,
          notes: data.notes ?? null,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated successfully.");
      setIsEditing(false);
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.detail?.message ?? "Failed to update order.";
      toast.error(msg);
    },
  });

  function onSubmit(data: EditFormData) {
    updateMutation.mutate(data);
  }

  if (!orderId) return null;

  return (
    <Dialog open={!!orderId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between pr-8">
          <div>
            <DialogTitle className="font-mono text-xl">
              {order?.order_number ?? `Order #${orderId}`}
            </DialogTitle>
            {order && (
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={order.status} />
                <span className="text-sm text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">
                  Created {format(new Date(order.created_at), "dd MMM yyyy")} by{" "}
                  {order.created_by_name}
                </span>
              </div>
            )}
          </div>
          {isAdmin && order && !isEditing && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {order && !isEditing && (
          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="products">
                Products ({order.items.length})
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Details tab */}
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Dealer</p>
                  <p className="font-medium">{order.dealer_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <p className="font-medium">
                    {order.assigned_to_name ?? (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Order Date</p>
                  <p>{format(new Date(order.order_date), "dd MMM yyyy")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Expected Delivery</p>
                  <p>
                    {order.expected_delivery_date
                      ? format(new Date(order.expected_delivery_date), "dd MMM yyyy")
                      : "—"}
                  </p>
                </div>
                {order.completed_at && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p>{format(new Date(order.completed_at), "dd MMM yyyy")}</p>
                  </div>
                )}
                {isAdmin && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-bold tabular-nums">{fmt(order.total_amount)}</p>
                  </div>
                )}
              </div>
              {order.notes && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm italic text-muted-foreground">{order.notes}</p>
                </div>
              )}

              <Separator />

              {/* Status update section */}
              {(isAdmin || order.assigned_to_id) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Update Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StatusUpdatePanel orderId={orderId} current={order.status} />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Products tab */}
            <TabsContent value="products" className="space-y-4 mt-4">
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Product
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Qty
                      </th>
                      {isAdmin && (
                        <>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                            Subtotal
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.product_sku}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {item.quantity}
                        </td>
                        {isAdmin && (
                          <>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {fmt(item.unit_price)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-medium">
                              {fmt(item.subtotal)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {isAdmin && (
                    <tfoot>
                      <tr className="bg-muted/30">
                        <td colSpan={3} className="px-4 py-3 text-right font-medium">
                          Total
                        </td>
                        <td className="px-4 py-3 text-right text-lg font-bold tabular-nums">
                          {fmt(order.total_amount)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </TabsContent>

            {/* History tab */}
            <TabsContent value="history" className="mt-4">
              <StatusTimeline logs={order.status_logs} />
            </TabsContent>
          </Tabs>
        )}

        {/* Edit form */}
        {order && isEditing && isAdmin && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Dealer */}
              <div className="space-y-1">
                <Label>Dealer <span className="text-destructive">*</span></Label>
                <Controller
                  control={control}
                  name="dealer_id"
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(dealers?.items ?? []).map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.dealer_id && (
                  <p className="text-xs text-destructive">
                    {errors.dealer_id.message}
                  </p>
                )}
              </div>

              {/* Assigned To */}
              <div className="space-y-1">
                <Label>Assign To</Label>
                <Controller
                  control={control}
                  name="assigned_to_id"
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() ?? "unassigned"}
                      onValueChange={(v) =>
                        field.onChange(v === "unassigned" ? undefined : Number(v))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          <span className="text-muted-foreground">Unassigned</span>
                        </SelectItem>
                        {(employees?.items ?? []).map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>
                            {e.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Order Date */}
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
                          className={cn(
                            "w-full justify-start font-normal h-9",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(field.value, "dd MMM yyyy")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(d) => {
                            field.onChange(d);
                            setOrderDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>

              {/* Expected Delivery */}
              <div className="space-y-1">
                <Label>Expected Delivery</Label>
                <Controller
                  control={control}
                  name="expected_delivery_date"
                  render={({ field }) => (
                    <Popover
                      open={deliveryDateOpen}
                      onOpenChange={setDeliveryDateOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start font-normal h-9",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(field.value, "dd MMM yyyy")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          disabled={(d) => (orderDate ? d < orderDate : false)}
                          onSelect={(d) => {
                            field.onChange(d);
                            setDeliveryDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>Notes</Label>
              <Controller
                control={control}
                name="notes"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Any special instructions…"
                    rows={2}
                  />
                )}
              />
            </div>

            {/* Product list (read-only in edit mode) */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Products (view only)</Label>
              <div className="rounded-md border bg-muted/20 p-3 text-sm">
                {order.items.map((item, i) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex justify-between py-1",
                      i > 0 && "border-t pt-2 mt-1"
                    )}
                  >
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>
                    {isAdmin && (
                      <span className="font-medium">{fmt(item.subtotal)}</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic">
                Note: Product items cannot be edited after order creation
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-1.5 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

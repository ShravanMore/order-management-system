"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, Circle, Loader2, User,
} from "lucide-react";

import apiClient from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { StatusBadge, nextStatuses } from "@/components/orders/status-badge";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { OrderDetail, OrderStatus, User as UserType } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmployeeListResponse {
  items: UserType[];
  total_count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(v));
}

function fmtDate(iso: string) {
  return format(new Date(iso), "dd MMM yyyy, h:mm a");
}

// ─── Status update panel ─────────────────────────────────────────────────────

function StatusUpdatePanel({
  orderId, current,
}: { orderId: number; current: OrderStatus }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<OrderStatus | "">("");
  const [remarks, setRemarks]   = useState("");

  const valid = nextStatuses(current);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient
        .patch(`/orders/${orderId}/status`, { status: selected, remarks: remarks || null })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      toast.success("Order status updated.");
      setSelected("");
      setRemarks("");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message ?? "Failed to update status.";
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
        <Select value={selected} onValueChange={(v) => setSelected(v as OrderStatus)}>
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
        <Label className="text-xs">Remarks <span className="text-muted-foreground">(optional)</span></Label>
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
      >
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Status
      </Button>
    </div>
  );
}

// ─── Assign employee panel ────────────────────────────────────────────────────

function AssignEmployeePanel({
  orderId, currentAssigneeId,
}: { orderId: number; currentAssigneeId: number | null }) {
  const queryClient = useQueryClient();

  const { data: employees, isLoading, error } = useQuery({
    queryKey: ["employees-list"],
    queryFn: () =>
      apiClient
        .get<EmployeeListResponse>("/employees?page=1&page_size=50")
        .then((r) => r.data),
    staleTime: 60_000,
  });

  // Debug logging
  if (error) {
    console.error("Failed to load employees:", error);
  }
  if (employees) {
    console.log("Loaded employees:", employees.items.length, employees.items);
  }

  const mutation = useMutation({
    mutationFn: (assignedToId: number | null) =>
      apiClient
        .put(`/orders/${orderId}`, { assigned_to_id: assignedToId })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      toast.success("Assignment updated.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message ?? "Failed to update assignment.";
      toast.error(msg);
    },
  });

  return (
    <Select
      value={currentAssigneeId?.toString() ?? "unassigned"}
      onValueChange={(v) => mutation.mutate(v === "unassigned" ? null : Number(v))}
      disabled={isLoading}
    >
      <SelectTrigger className="h-9 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          <span className="text-muted-foreground">Unassigned</span>
        </SelectItem>
        {isLoading && (
          <SelectItem value="loading" disabled>
            <span className="text-muted-foreground">Loading employees...</span>
          </SelectItem>
        )}
        {!isLoading && (employees?.items ?? []).length === 0 && (
          <SelectItem value="no-employees" disabled>
            <span className="text-muted-foreground">No active employees found</span>
          </SelectItem>
        )}
        {(employees?.items ?? []).map((e) => (
          <SelectItem key={e.id} value={String(e.id)}>
            {e.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Status timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ logs }: { logs: OrderDetail["status_logs"] }) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No status changes recorded yet.</p>
    );
  }

  return (
    <ol className="relative border-l border-border ml-2 space-y-4">
      {[...logs].reverse().map((log, i) => (
        <li key={log.id} className="ml-5">
          <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full border bg-background">
            {i === 0
              ? <CheckCircle2 className="h-3 w-3 text-primary" />
              : <Circle className="h-2.5 w-2.5 text-muted-foreground" />
            }
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
              {" · "}{fmtDate(log.created_at)}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orderId = Number(id);
  const { isAdmin } = useAuth();

  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () =>
      apiClient.get<OrderDetail>(`/orders/${orderId}`).then((r) => r.data),
    enabled: !isNaN(orderId),
  });

  if (isLoading) {
    return <LoadingState variant="table" count={6} columns={3} className="max-w-3xl" />;
  }

  if (isError || !order) {
    return (
      <ErrorState
        message="Could not load order details."
        onRetry={() => refetch()}
        className="max-w-3xl"
      />
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/orders">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight font-mono">{order.order_number}</h2>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {fmtDate(order.created_at)} by {order.created_by_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left column (2/3) ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Dealer + dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Order Info</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Dealer</p>
                <p className="font-medium">{order.dealer_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Order Date</p>
                <p>{format(new Date(order.order_date), "dd MMM yyyy")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Expected Delivery</p>
                <p>{order.expected_delivery_date
                  ? format(new Date(order.expected_delivery_date), "dd MMM yyyy")
                  : "—"}</p>
              </div>
              {order.completed_at && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Completed</p>
                  <p>{format(new Date(order.completed_at), "dd MMM yyyy")}</p>
                </div>
              )}
              {order.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Notes</p>
                  <p className="italic text-muted-foreground">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Line Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Desktop table */}
              <div className="hidden sm:block rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Product</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Unit Price</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">{item.product_sku}</p>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(item.unit_price)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">{fmt(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="rounded-md border p-3 space-y-1">
                    <p className="font-medium text-sm">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">{item.product_sku}</p>
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-muted-foreground">{item.quantity} × {fmt(item.unit_price)}</span>
                      <span className="font-semibold tabular-nums">{fmt(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Order Total</p>
                  <p className="text-xl font-bold tabular-nums">{fmt(order.total_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status history */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline logs={order.status_logs} />
            </CardContent>
          </Card>
        </div>

        {/* ── Right column (1/3) ─────────────────────────────── */}
        <div className="space-y-4">

          {/* Assigned employee — admin only */}
          {isAdmin && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned To
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AssignEmployeePanel
                  orderId={orderId}
                  currentAssigneeId={order.assigned_to_id}
                />
              </CardContent>
            </Card>
          )}

          {/* Status update */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusUpdatePanel orderId={orderId} current={order.status} />
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

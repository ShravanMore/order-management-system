"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon, Plus, ClipboardList, Loader2 } from "lucide-react";
import type { DateRange } from "react-day-picker";

import apiClient from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge, nextStatuses } from "@/components/orders/status-badge";
import { OrderDetailModal } from "@/components/orders/order-detail-modal";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderListResponse {
  items: Order[];
  total_count: number;
  page: number;
  page_size: number;
}

const STATUS_OPTIONS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all",       label: "All statuses" },
  { value: "pending",   label: "Pending" },
  { value: "ongoing",   label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function fmt(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(value));
}

// ─── Quick status-update dialog ───────────────────────────────────────────────

interface StatusDialogProps {
  order: Order | null;
  onClose: () => void;
}

function QuickStatusDialog({ order, onClose }: StatusDialogProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<OrderStatus | "">("");
  const [remarks, setRemarks]   = useState("");

  const valid = order ? nextStatuses(order.status) : [];

  const mutation = useMutation({
    mutationFn: () =>
      apiClient
        .patch(`/orders/${order!.id}/status`, {
          status: selected,
          remarks: remarks || null,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated.");
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message ?? "Failed to update status.";
      toast.error(msg);
    },
  });

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSelected("");
      setRemarks("");
      onClose();
    }
  }

  return (
    <Dialog open={!!order} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
          <DialogDescription>
            <span className="font-mono text-xs">{order?.order_number}</span>
            {" — "}current: <StatusBadge status={order?.status ?? "pending"} />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">New status</Label>
            {valid.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-2">
                This order is in a terminal state and cannot be updated.
              </p>
            ) : (
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
            )}
          </div>

          {valid.length > 0 && (
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
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {valid.length > 0 && (
            <Button
              disabled={!selected || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();

  // Employee-specific: "mine" = assigned to me, "all" = all orders (read-only)
  const [viewMode, setViewMode]   = useState<"mine" | "all">("mine");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calOpen, setCalOpen]     = useState(false);
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(10);

  // Quick status-update dialog
  const [statusOrder, setStatusOrder] = useState<Order | null>(null);
  
  // Order detail modal
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", { viewMode, statusFilter, dateRange, page, pageSize, isAdmin }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(dateRange?.from && { date_from: dateRange.from.toISOString() }),
        ...(dateRange?.to   && { date_to:   dateRange.to.toISOString()   }),
      });

      // For employees: default to showing orders assigned to them;
      // "all" toggle passes show_all=true to get all orders
      if (!isAdmin) {
        if (viewMode === "all") params.set("show_all", "true");
        // viewMode === "mine": no extra param — backend defaults to assigned+unassigned
      }

      return apiClient
        .get<OrderListResponse>(`/orders?${params}`)
        .then((r) => r.data);
    },
    placeholderData: (prev) => prev,
  });

  // Client-side search filter on order# / dealer
  const filtered = search
    ? (data?.items ?? []).filter(
        (o) =>
          o.order_number.toLowerCase().includes(search.toLowerCase()) ||
          o.dealer_name.toLowerCase().includes(search.toLowerCase())
      )
    : (data?.items ?? []);

  // ── Columns ──────────────────────────────────────────────────────────────

  const columns: ColumnDef<Order>[] = [
    {
      key: "order_number",
      header: "Order #",
      sortable: true,
      cell: (row) => (
        <button
          onClick={() => setDetailOrderId(row.id)}
          className="font-mono text-xs font-semibold text-primary hover:underline"
        >
          {row.order_number}
        </button>
      ),
    },
    {
      key: "dealer_name",
      header: "Dealer",
      sortable: true,
      cell: (row) => <span className="text-sm">{row.dealer_name}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "assigned_to_name",
      header: "Assigned To",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.assigned_to_name ?? "—"}
        </span>
      ),
      className: "hidden md:table-cell",
    },
    {
      key: "order_date",
      header: "Date",
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.order_date), "dd MMM yyyy")}
        </span>
      ),
      className: "hidden sm:table-cell",
    },
    // Amount column - admin only
    ...(isAdmin
      ? [
          {
            key: "total_amount",
            header: "Amount",
            sortable: true,
            cell: (row: Order) => (
              <span className="text-sm font-medium tabular-nums">{fmt(row.total_amount)}</span>
            ),
            className: "text-right",
          } satisfies ColumnDef<Order>,
        ]
      : []),
    // Quick status-update — shown for employees when the order is assigned to them
    // (or for admins on any order) and the order is not in a terminal state
    {
      key: "quick_status",
      header: "",
      cell: (row) => {
        const canUpdate =
          nextStatuses(row.status).length > 0 &&
          (isAdmin || row.assigned_to_id === user?.id);

        if (!canUpdate) return null;

        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => {
              e.preventDefault();
              setStatusOrder(row);
            }}
          >
            Update
          </Button>
        );
      },
      className: "w-20",
    },
  ];

  // ── Date range label ──────────────────────────────────────────────────────

  const dateLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "dd MMM")} – ${format(dateRange.to, "dd MMM yyyy")}`
      : format(dateRange.from, "dd MMM yyyy")
    : "Date range";

  // ── Toolbar ───────────────────────────────────────────────────────────────

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      {/* My orders / All orders toggle — employees only */}
      {!isAdmin && (
        <div className="flex rounded-md border text-xs overflow-hidden">
          {(["mine", "all"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setViewMode(m); setPage(1); }}
              className={cn(
                "px-3 py-1.5 capitalize transition-colors",
                viewMode === m
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {m === "mine" ? "My Orders" : "All Orders"}
            </button>
          ))}
        </div>
      )}

      {/* Status filter */}
      <Select
        value={statusFilter}
        onValueChange={(v) => { setStatusFilter(v as OrderStatus | "all"); setPage(1); }}
      >
        <SelectTrigger className="h-9 w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range picker */}
      <Popover open={calOpen} onOpenChange={setCalOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{dateLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={(r) => { setDateRange(r); setPage(1); }}
            numberOfMonths={2}
          />
          {dateRange && (
            <div className="border-t p-2 text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDateRange(undefined); setPage(1); }}
              >
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* New order — admin only */}
      {isAdmin && (
        <Button size="sm" asChild>
          <Link href="/orders/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New Order
          </Link>
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Manage all orders."
              : viewMode === "mine"
              ? "Orders assigned to you."
              : "All orders (read-only for unassigned)."}
          </p>
        </div>

        <DataTable<Order>
          columns={columns}
          data={filtered}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage="Could not load orders. Please try again."
          searchValue={search}
          searchPlaceholder="Search order # or dealer…"
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          pagination={{ page, pageSize, total: data?.total_count ?? 0 }}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          emptyIcon={ClipboardList}
          emptyHeading="No orders found"
          emptyDescription={
            search || statusFilter !== "all" || dateRange
              ? "Try adjusting your filters."
              : isAdmin
              ? "Create your first order to get started."
              : viewMode === "mine"
              ? "No orders are assigned to you yet."
              : "No orders exist yet."
          }
          emptyActionLabel={
            isAdmin && !search && statusFilter === "all" && !dateRange
              ? "New Order"
              : undefined
          }
          onEmptyAction={
            isAdmin && !search && statusFilter === "all" && !dateRange
              ? () => { window.location.href = "/orders/new"; }
              : undefined
          }
          toolbar={toolbar}
          mobileCard={(order) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => setDetailOrderId(order.id)}
                  className="font-mono text-sm font-semibold text-primary hover:underline text-left"
                >
                  {order.order_number}
                </button>
                <StatusBadge status={order.status} />
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.dealer_name}</p>
                <p className="text-muted-foreground">
                  {order.assigned_to_name ?? "Unassigned"}
                </p>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(order.order_date), "dd MMM yyyy")}
                  </span>
                  {isAdmin && (
                    <span className="font-semibold tabular-nums">{fmt(order.total_amount)}</span>
                  )}
                </div>
              </div>
            </div>
          )}
          onRowClick={(order) => setDetailOrderId(order.id)}
        />
      </div>

      {/* Quick status update dialog */}
      <QuickStatusDialog
        order={statusOrder}
        onClose={() => setStatusOrder(null)}
      />

      {/* Order detail modal */}
      <OrderDetailModal
        orderId={detailOrderId}
        onClose={() => setDetailOrderId(null)}
      />
    </>
  );
}

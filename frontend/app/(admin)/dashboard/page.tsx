"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Building2,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import apiClient from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/orders/status-badge";
import type {
  DashboardSummary,
  OrdersTrendResponse,
  TopProductsResponse,
  TopDealersResponse,
  RecentOrdersResponse,
  RecentOrderItem,
  OrderStatus,
} from "@/types";

// ─── Currency formatter ────────────────────────────────────────────────────────

function fmt(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

// ─── Chart colours (CSS-var-aware) ────────────────────────────────────────────
// Using explicit hex values so Recharts can render them independently of CSS vars.
const CHART_COLORS = {
  orders:    "#6366f1",   // indigo-500
  revenue:   "#10b981",   // emerald-500
  pie: ["#6366f1", "#3b82f6", "#10b981", "#f59e0b"],
};

// ─── KPI Cards ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconClass?: string;
}

function KpiCard({ icon: Icon, label, value, iconClass = "text-muted-foreground" }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// ─── Trend chart ──────────────────────────────────────────────────────────────

function TrendChart() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "orders-trend", period],
    queryFn: () =>
      apiClient
        .get<OrdersTrendResponse>(`/dashboard/orders-trend?period=${period}`)
        .then((r) => r.data),
  });

  // Shorten period labels for readability
  const chartData = (data?.data ?? []).map((item) => ({
    ...item,
    label: period === "monthly"
      ? item.period.slice(5)           // "2026-04" → "04"
      : item.period.replace(/.*-W/, "W"), // "2026-W04" → "W04"
    revenue: Number(item.revenue),
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">Orders Trend</CardTitle>
        <div className="flex rounded-md border text-xs overflow-hidden">
          {(["monthly", "weekly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 capitalize transition-colors ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading && <LoadingState variant="table" count={4} columns={1} className="h-56" />}
        {isError && <ErrorState onRetry={() => refetch()} className="h-56" />}
        {!isLoading && !isError && (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-muted-foreground"
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-muted-foreground"
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--popover-foreground))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                formatter={(value, name) =>
                  name === "revenue" ? fmt(value as number) : value
                }
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar yAxisId="left"  dataKey="order_count" name="Orders"  fill={CHART_COLORS.orders}  radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="revenue"     name="Revenue" fill={CHART_COLORS.revenue} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Status donut ─────────────────────────────────────────────────────────────

const PIE_STATUSES = [
  { key: "pending_orders",   label: "Pending",   color: "#f59e0b" },
  { key: "ongoing_orders",   label: "Ongoing",   color: "#3b82f6" },
  { key: "completed_orders", label: "Completed", color: "#10b981" },
  { key: "cancelled_orders", label: "Cancelled", color: "#ef4444" },
] as const;

function StatusDonut({ summary }: { summary: DashboardSummary }) {
  const pieData = PIE_STATUSES.map((s) => ({
    name: s.label,
    value: summary[s.key],
    color: s.color,
  })).filter((d) => d.value > 0);

  if (pieData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No order data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {pieData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--popover-foreground))",
            borderRadius: "6px",
            fontSize: "12px",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px" }}
          formatter={(value) => <span className="text-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Top lists ────────────────────────────────────────────────────────────────

function RankBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── Recent orders columns ────────────────────────────────────────────────────

const recentOrdersColumns = [
  {
    key: "order_number",
    header: "Order #",
    cell: (row: RecentOrderItem) => (
      <Link href={`/orders/${row.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
        {row.order_number}
      </Link>
    ),
  },
  {
    key: "dealer_name",
    header: "Dealer",
    cell: (row: RecentOrderItem) => (
      <span className="text-sm">{row.dealer_name}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (row: RecentOrderItem) => <StatusBadge status={row.status} />,
  },
  {
    key: "total_amount",
    header: "Amount",
    cell: (row: RecentOrderItem) => (
      <span className="text-sm font-medium">{fmt(row.total_amount)}</span>
    ),
    className: "text-right",
  },
  {
    key: "order_date",
    header: "Date",
    cell: (row: RecentOrderItem) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.order_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
      </span>
    ),
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () =>
      apiClient.get<DashboardSummary>("/dashboard/summary").then((r) => r.data),
  });

  const topProductsQuery = useQuery({
    queryKey: ["dashboard", "top-products"],
    queryFn: () =>
      apiClient.get<TopProductsResponse>("/dashboard/top-products?limit=5").then((r) => r.data),
  });

  const topDealersQuery = useQuery({
    queryKey: ["dashboard", "top-dealers"],
    queryFn: () =>
      apiClient.get<TopDealersResponse>("/dashboard/top-dealers?limit=5").then((r) => r.data),
  });

  const recentOrdersQuery = useQuery({
    queryKey: ["dashboard", "recent-orders"],
    queryFn: () =>
      apiClient.get<RecentOrdersResponse>("/dashboard/recent-orders?limit=10").then((r) => r.data),
  });

  const s = summaryQuery.data;

  return (
    <div className="space-y-6">

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      {summaryQuery.isLoading && (
        <LoadingState variant="cards" count={8} />
      )}
      {summaryQuery.isError && (
        <ErrorState
          message="Could not load summary statistics."
          onRetry={() => summaryQuery.refetch()}
        />
      )}
      {s && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard icon={ClipboardList} label="Total Orders"      value={s.total_orders} />
          <KpiCard icon={Clock}         label="Pending"           value={s.pending_orders}   iconClass="text-yellow-500" />
          <KpiCard icon={TrendingUp}    label="Ongoing"           value={s.ongoing_orders}   iconClass="text-blue-500" />
          <KpiCard icon={CheckCircle2}  label="Completed"         value={s.completed_orders} iconClass="text-green-500" />
          <KpiCard icon={DollarSign}    label="Revenue (Month)"   value={fmt(s.current_month_revenue)} iconClass="text-emerald-500" />
          <KpiCard icon={AlertTriangle} label="Low Stock"         value={s.low_stock_products}    iconClass="text-orange-500" />
          <KpiCard icon={Building2}     label="Active Dealers"    value={s.total_active_dealers} />
          <KpiCard icon={Users}         label="Active Employees"  value={s.total_active_employees} />
        </div>
      )}

      {/* ── Trend + Status row ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Trend chart — spans 2 cols on desktop */}
        <div className="lg:col-span-2">
          <TrendChart />
        </div>

        {/* Status donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {summaryQuery.isLoading && <LoadingState variant="table" count={3} columns={1} className="h-48" />}
            {summaryQuery.isError && <ErrorState onRetry={() => summaryQuery.refetch()} className="h-48" />}
            {s && <StatusDonut summary={s} />}
          </CardContent>
        </Card>
      </div>

      {/* ── Top products + Top dealers ────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Products</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {topProductsQuery.isLoading && <LoadingState variant="table" count={5} columns={2} />}
            {topProductsQuery.isError && (
              <ErrorState onRetry={() => topProductsQuery.refetch()} />
            )}
            {topProductsQuery.data && (() => {
              const items = topProductsQuery.data.data;
              const maxQty = Math.max(...items.map((i) => i.total_quantity_sold), 1);
              return (
                <ul className="space-y-3">
                  {items.map((item, idx) => (
                    <li key={item.product_id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</span>
                          <span className="truncate text-sm font-medium">{item.product_name}</span>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {item.total_quantity_sold} units
                        </span>
                      </div>
                      <RankBar value={item.total_quantity_sold} max={maxQty} color={CHART_COLORS.orders} />
                    </li>
                  ))}
                  {items.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">No data yet</p>
                  )}
                </ul>
              );
            })()}
          </CardContent>
        </Card>

        {/* Top Dealers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Dealers</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {topDealersQuery.isLoading && <LoadingState variant="table" count={5} columns={2} />}
            {topDealersQuery.isError && (
              <ErrorState onRetry={() => topDealersQuery.refetch()} />
            )}
            {topDealersQuery.data && (() => {
              const items = topDealersQuery.data.data;
              const maxVal = Math.max(...items.map((i) => Number(i.total_value)), 1);
              return (
                <ul className="space-y-3">
                  {items.map((item, idx) => (
                    <li key={item.dealer_id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</span>
                          <span className="truncate text-sm font-medium">{item.dealer_name}</span>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {fmt(item.total_value)}
                        </span>
                      </div>
                      <RankBar value={Number(item.total_value)} max={maxVal} color={CHART_COLORS.revenue} />
                    </li>
                  ))}
                  {items.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">No data yet</p>
                  )}
                </ul>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Orders ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/orders">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable<RecentOrderItem>
            columns={recentOrdersColumns}
            data={recentOrdersQuery.data?.data ?? []}
            rowKey={(r) => r.id}
            isLoading={recentOrdersQuery.isLoading}
            isError={recentOrdersQuery.isError}
            errorMessage="Could not load recent orders."
            emptyHeading="No orders yet"
            emptyDescription="Orders will appear here once created."
          />
        </CardContent>
      </Card>

    </div>
  );
}

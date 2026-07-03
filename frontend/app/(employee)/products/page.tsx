"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Plus, Package } from "lucide-react";

import apiClient from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { AdjustStockDialog } from "@/components/products/adjust-stock-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PRODUCT_CATEGORIES } from "@/components/products/product-form-dialog";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductListResponse {
  items: Product[];
  total_count: number;
  page: number;
  page_size: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(v));
}

// ─── Stock badge ──────────────────────────────────────────────────────────────

function StockCell({ product }: { product: Product }) {
  const isLow = product.stock_quantity <= product.low_stock_threshold;
  return (
    <div className="flex items-center gap-2">
      <span className="tabular-nums">{product.stock_quantity}</span>
      {isLow && (
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
          Low
        </span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // ── Filter/pagination state ──────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>();
  const [adjustProduct, setAdjustProduct] = useState<Product | undefined>();

  // ── Fetch ────────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", { search, category, page, pageSize }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (search) params.set("name", search);
      if (category && category !== "all") params.set("category", category);
      return apiClient
        .get<ProductListResponse>(`/products?${params}`)
        .then((r) => r.data);
    },
    placeholderData: (prev) => prev,
  });

  // ── Deactivate mutation ──────────────────────────────────────────────────
  const deactivateMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deactivated.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message ?? "Failed to deactivate product.";
      toast.error(msg);
    },
  });

  // ── Column definitions ───────────────────────────────────────────────────
  const columns: ColumnDef<Product>[] = [
    {
      key: "image",
      header: "",
      cell: (row) =>
        row.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.image_url}
            alt={row.name}
            className="h-9 w-9 rounded-md object-cover border"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
        ),
      className: "w-12",
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-sm">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.sku}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.category}</span>
      ),
      className: "hidden md:table-cell",
    },
    // Price column - admin only
    ...(isAdmin
      ? [
          {
            key: "price",
            header: "Price",
            sortable: true,
            cell: (row: Product) => (
              <span className="tabular-nums text-sm font-medium">
                ₹{Number(row.price).toLocaleString("en-IN")}
              </span>
            ),
            className: "text-right",
          } satisfies ColumnDef<Product>,
        ]
      : []),
    {
      key: "stock_quantity",
      header: "Stock",
      sortable: true,
      cell: (row) => <StockCell product={row} />,
    },
    {
      key: "unit",
      header: "Unit",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.unit}</span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      key: "is_active",
      header: "Status",
      cell: (row) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.is_active
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
      className: "hidden sm:table-cell",
    },
    // Admin-only actions column
    ...(isAdmin
      ? [
          {
            key: "actions",
            header: "",
            cell: (row: Product) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      setEditProduct(row);
                      setFormOpen(true);
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setAdjustProduct(row)}>
                    Adjust Stock
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <ConfirmDialog
                    trigger={
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        Deactivate
                      </DropdownMenuItem>
                    }
                    title="Deactivate Product"
                    description={`Are you sure you want to deactivate "${row.name}"? It will no longer appear in orders.`}
                    confirmLabel="Deactivate"
                    onConfirm={async () => { await deactivateMutation.mutateAsync(row.id); }}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            ),
            className: "w-10",
          } satisfies ColumnDef<Product>,
        ]
      : []),
  ];

  // ── Toolbar ──────────────────────────────────────────────────────────────
  const toolbar = (
    <div className="flex items-center gap-2">
      {/* Category filter */}
      <Select
        value={category}
        onValueChange={(v) => {
          setCategory(v);
          setPage(1);
        }}
      >
        <SelectTrigger className="h-9 w-[180px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {PRODUCT_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Add button — admin only */}
      {isAdmin && (
        <Button
          size="sm"
          onClick={() => {
            setEditProduct(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Product
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Manage your physiotherapy equipment catalog."
              : "Browse available physiotherapy equipment."}
          </p>
        </div>

        <DataTable<Product>
          columns={columns}
          data={data?.items ?? []}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage="Could not load products. Please try again."
          searchValue={search}
          searchPlaceholder="Search by name or SKU…"
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          pagination={{
            page,
            pageSize,
            total: data?.total_count ?? 0,
          }}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          emptyIcon={Package}
          emptyHeading="No products found"
          emptyDescription={
            search || category !== "all"
              ? "Try adjusting your search or category filter."
              : isAdmin
              ? "Get started by adding your first product."
              : "No products are available yet."
          }
          emptyActionLabel={isAdmin && !search && category === "all" ? "Add Product" : undefined}
          onEmptyAction={
            isAdmin && !search && category === "all"
              ? () => {
                  setEditProduct(undefined);
                  setFormOpen(true);
                }
              : undefined
          }
          toolbar={toolbar}
          mobileCard={(product) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                </div>
                {product.is_active ? (
                  <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    Active
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  {isAdmin && (
                    <p className="font-semibold tabular-nums">{fmt(product.price)}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-medium",
                    product.stock_quantity <= product.low_stock_threshold
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}>
                    {product.stock_quantity} {product.unit}(s)
                  </p>
                  {product.stock_quantity <= product.low_stock_threshold && (
                    <p className="text-xs text-destructive">Low stock</p>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="pt-1 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditProduct(product);
                      setFormOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  {product.is_active && (
                    <ConfirmDialog
                      trigger={
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-destructive hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Deactivate
                        </Button>
                      }
                      title="Deactivate Product"
                      description={`Are you sure you want to deactivate "${product.name}"?`}
                      confirmLabel="Deactivate"
                      onConfirm={async () => { await deactivateMutation.mutateAsync(product.id); }}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        />
      </div>

      {/* Dialogs — admin only */}
      {isAdmin && (
        <>
          <ProductFormDialog
            open={formOpen}
            onOpenChange={(o) => {
              setFormOpen(o);
              if (!o) setEditProduct(undefined);
            }}
            product={editProduct}
          />

          {adjustProduct && (
            <AdjustStockDialog
              open={!!adjustProduct}
              onOpenChange={(o) => {
                if (!o) setAdjustProduct(undefined);
              }}
              product={adjustProduct}
            />
          )}
        </>
      )}
    </>
  );
}

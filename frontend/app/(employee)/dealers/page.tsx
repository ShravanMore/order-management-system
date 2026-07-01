"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Plus, Building2 } from "lucide-react";

import apiClient from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DealerFormDialog } from "@/components/dealers/dealer-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dealer } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DealerListResponse {
  items: Dealer[];
  total_count: number;
  page: number;
  page_size: number;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DealersPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // ── Filter / pagination state ────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [editDealer, setEditDealer] = useState<Dealer | undefined>();

  // ── Fetch ────────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dealers", { search, page, pageSize }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      // Backend supports ?name= and ?city= separately; search both
      if (search) {
        params.set("name", search);
      }
      return apiClient
        .get<DealerListResponse>(`/dealers?${params}`)
        .then((r) => r.data);
    },
    placeholderData: (prev) => prev,
  });

  // ── Deactivate mutation ──────────────────────────────────────────────────
  const deactivateMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/dealers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealers"] });
      toast.success("Dealer deactivated.");
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.detail?.message ?? "Failed to deactivate dealer.";
      toast.error(msg);
    },
  });

  // ── Column definitions ───────────────────────────────────────────────────
  const columns: ColumnDef<Dealer>[] = [
    {
      key: "name",
      header: "Company",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-sm">{row.name}</p>
          {row.gst_number && (
            <p className="text-xs text-muted-foreground font-mono">{row.gst_number}</p>
          )}
        </div>
      ),
    },
    {
      key: "contact_person",
      header: "Contact",
      cell: (row) => (
        <div>
          <p className="text-sm">{row.contact_person}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      key: "city",
      header: "Location",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="text-sm">{row.city}</p>
          <p className="text-xs text-muted-foreground">{row.state}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => (
        <a
          href={`tel:${row.phone}`}
          className="text-sm hover:underline text-muted-foreground"
        >
          {row.phone}
        </a>
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
            cell: (row: Dealer) => (
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
                      setEditDealer(row);
                      setFormOpen(true);
                    }}
                  >
                    Edit
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
                    title="Deactivate Dealer"
                    description={`Are you sure you want to deactivate "${row.name}"? They will no longer be available for new orders.`}
                    confirmLabel="Deactivate"
                    onConfirm={async () => {
                      await deactivateMutation.mutateAsync(row.id);
                    }}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            ),
            className: "w-10",
          } satisfies ColumnDef<Dealer>,
        ]
      : []),
  ];

  // ── Toolbar ──────────────────────────────────────────────────────────────
  const toolbar = isAdmin ? (
    <Button
      size="sm"
      onClick={() => {
        setEditDealer(undefined);
        setFormOpen(true);
      }}
    >
      <Plus className="mr-1.5 h-4 w-4" />
      Add Dealer
    </Button>
  ) : undefined;

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dealers</h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Manage your dealer network."
              : "Browse registered dealers."}
          </p>
        </div>

        <DataTable<Dealer>
          columns={columns}
          data={data?.items ?? []}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage="Could not load dealers. Please try again."
          // Search
          searchValue={search}
          searchPlaceholder="Search by name or city…"
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          // Pagination
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
          // Empty state
          emptyIcon={Building2}
          emptyHeading="No dealers found"
          emptyDescription={
            search
              ? "Try adjusting your search term."
              : isAdmin
              ? "Get started by adding your first dealer."
              : "No dealers are registered yet."
          }
          emptyActionLabel={isAdmin && !search ? "Add Dealer" : undefined}
          onEmptyAction={
            isAdmin && !search
              ? () => {
                  setEditDealer(undefined);
                  setFormOpen(true);
                }
              : undefined
          }
          toolbar={toolbar}
        />
      </div>

      {/* Create / Edit dialog — admin only */}
      {isAdmin && (
        <DealerFormDialog
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o);
            if (!o) setEditDealer(undefined);
          }}
          dealer={editDealer}
        />
      )}
    </>
  );
}

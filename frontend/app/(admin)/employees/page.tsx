"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Plus, Users } from "lucide-react";

import apiClient from "@/lib/api-client";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Employee, EmployeeWorkload } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmployeeListResponse {
  items: Employee[];
  total_count: number;
  page: number;
  page_size: number;
}

// ─── Workload badge ───────────────────────────────────────────────────────────

function WorkloadBadge({ employeeId }: { employeeId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["employee-workload", employeeId],
    queryFn: () =>
      apiClient
        .get<EmployeeWorkload>(`/employees/${employeeId}/workload`)
        .then((r) => r.data),
    staleTime: 60_000,
  });

  if (isLoading) return <span className="text-xs text-muted-foreground">—</span>;

  const active = (data?.pending_orders ?? 0) + (data?.ongoing_orders ?? 0);
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span
        className={`rounded-full px-2 py-0.5 font-medium ${
          active === 0
            ? "bg-muted text-muted-foreground"
            : active <= 3
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
        }`}
      >
        {active} active
      </span>
      <span className="text-muted-foreground">{data?.completed_orders ?? 0} done</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen]       = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>();

  // ── Fetch ────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["employees", { search, page, pageSize }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        ...(search && { search }),
      });
      return apiClient
        .get<EmployeeListResponse>(`/employees?${params}`)
        .then((r) => r.data);
    },
    placeholderData: (prev) => prev,
    retry: 1, // Only retry once
  });

  // Log errors for debugging
  if (error) {
    console.error("Employees API Error:", error);
    const axiosError = error as any;
    if (axiosError.response) {
      console.error("Status:", axiosError.response.status);
      console.error("Data:", axiosError.response.data);
    }
  }

  // ── Deactivate mutation ──────────────────────────────────────────────────
  const deactivateMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deactivated.");
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.detail?.message ?? "Failed to deactivate employee.";
      toast.error(msg);
    },
  });

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns: ColumnDef<Employee>[] = [
    {
      key: "full_name",
      header: "Employee",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-sm">{row.full_name}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) =>
        row.phone ? (
          <a href={`tel:${row.phone}`} className="text-sm hover:underline text-muted-foreground">
            {row.phone}
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
      className: "hidden md:table-cell",
    },
    {
      key: "workload",
      header: "Workload",
      cell: (row) => <WorkloadBadge employeeId={row.id} />,
      className: "hidden sm:table-cell",
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
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
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
                setEditEmployee(row);
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
                  disabled={!row.is_active}
                >
                  Deactivate
                </DropdownMenuItem>
              }
              title="Deactivate Employee"
              description={`Are you sure you want to deactivate "${row.full_name}"? This action cannot be undone while they have active orders.`}
              confirmLabel="Deactivate"
              onConfirm={async () => {
                await deactivateMutation.mutateAsync(row.id);
              }}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-10",
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employees</h2>
          <p className="text-sm text-muted-foreground">
            Manage employee accounts and view workload.
          </p>
        </div>

        <DataTable<Employee>
          columns={columns}
          data={data?.items ?? []}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage={
            error 
              ? `Failed to load employees: ${
                  (error as any).response?.status === 401 
                    ? "Please logout and login again (session expired)" 
                    : (error as any).response?.status === 403
                    ? "Access denied. Admin role required."
                    : (error as any).response?.data?.detail?.message || (error as any).message || "Please try again."
                }`
              : "Could not load employees. Please try again."
          }
          searchValue={search}
          searchPlaceholder="Search by name or email…"
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          pagination={{ page, pageSize, total: data?.total_count ?? 0 }}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          emptyIcon={Users}
          emptyHeading="No employees found"
          emptyDescription={
            search
              ? "Try adjusting your search."
              : "Add employees to assign orders to them."
          }
          emptyActionLabel={!search ? "Add Employee" : undefined}
          onEmptyAction={
            !search
              ? () => { setEditEmployee(undefined); setFormOpen(true); }
              : undefined
          }
          toolbar={
            <Button
              size="sm"
              onClick={() => { setEditEmployee(undefined); setFormOpen(true); }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Employee
            </Button>
          }
          mobileCard={(employee) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{employee.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                </div>
                {employee.is_active ? (
                  <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    Active
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    Inactive
                  </span>
                )}
              </div>
              {employee.phone && (
                <p className="text-xs text-muted-foreground">{employee.phone}</p>
              )}
              <div className="pt-1 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditEmployee(employee);
                    setFormOpen(true);
                  }}
                >
                  Edit
                </Button>
                {employee.is_active && (
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
                    title="Deactivate Employee"
                    description={`Are you sure you want to deactivate "${employee.full_name}"?`}
                    confirmLabel="Deactivate"
                    onConfirm={async () => { await deactivateMutation.mutateAsync(employee.id); }}
                  />
                )}
              </div>
            </div>
          )}
        />
      </div>

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditEmployee(undefined);
        }}
        employee={editEmployee}
      />
    </>
  );
}

"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LoadingState } from "./loading-state";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import type { LucideIcon } from "lucide-react";

// ─── Column definition ────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  /** Unique key used as React key and sort field */
  key: string;
  /** Column header label */
  header: string;
  /** Render the cell value; receives the full row object */
  cell: (row: T) => React.ReactNode;
  /** Whether this column is sortable (default: false) */
  sortable?: boolean;
  /** Optional className for <th> and <td> */
  className?: string;
}

// ─── Sort state ───────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  direction: SortDirection;
}

// ─── Pagination state ─────────────────────────────────────────────────────────

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DataTableProps<T> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** The current page of data to display */
  data: T[];
  /** Unique key extractor for rows */
  rowKey: (row: T) => string | number;

  // State
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;

  // Search
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;

  // Sorting (controlled — parent manages sort state)
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;

  // Pagination (controlled)
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];

  // Empty state customisation
  emptyIcon?: LucideIcon;
  emptyHeading?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;

  // Slot rendered to the right of the search input (e.g. "Add" button)
  toolbar?: React.ReactNode;

  // Mobile card view
  /** Custom mobile card renderer (shows on <md breakpoint) */
  mobileCard?: (row: T) => React.ReactNode;
  /** Click handler for mobile cards (optional) */
  onRowClick?: (row: T) => void;

  className?: string;
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ columnKey, sort }: { columnKey: string; sort?: SortState }) {
  if (!sort || sort.key !== columnKey) {
    return <ChevronsUpDown className="ml-1 inline h-3.5 w-3.5 text-muted-foreground/50" />;
  }
  return sort.direction === "asc" ? (
    <ChevronUp className="ml-1 inline h-3.5 w-3.5" />
  ) : (
    <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  isError = false,
  errorMessage,
  searchValue = "",
  searchPlaceholder = "Search…",
  onSearchChange,
  sort,
  onSortChange,
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  emptyIcon,
  emptyHeading,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  toolbar,
  mobileCard,
  onRowClick,
  className,
}: DataTableProps<T>) {
  // ── Sorting handler ─────────────────────────────────────────────────────────
  function handleSort(key: string) {
    if (!onSortChange) return;
    if (sort?.key === key) {
      onSortChange({ key, direction: sort.direction === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ key, direction: "asc" });
    }
  }

  // ── Pagination helpers ──────────────────────────────────────────────────────
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;
  const currentPage = pagination?.page ?? 1;

  // Build page numbers to display (max 7 slots with ellipsis)
  function getPageNumbers(): (number | "…")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (currentPage > 3) pages.push("…");
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
      pages.push(p);
    }
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-3", className)}>
      {/* Toolbar: search + slot */}
      {(onSearchChange || toolbar) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {onSearchChange && (
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 w-full sm:max-w-xs"
            />
          )}
          {toolbar && <div className="flex flex-wrap shrink-0 items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {/* Desktop Table (hidden on mobile if mobileCard provided) */}
      <div className={cn("rounded-md border", mobileCard && "hidden md:block")}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.sortable && onSortChange ? "cursor-pointer select-none" : "",
                    col.className
                  )}
                  onClick={col.sortable && onSortChange ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center">
                    {col.header}
                    {col.sortable && <SortIcon columnKey={col.key} sort={sort} />}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* Loading */}
            {isLoading && (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <LoadingState variant="table" count={pagination?.pageSize ?? 5} columns={columns.length} />
                </TableCell>
              </TableRow>
            )}

            {/* Error */}
            {!isLoading && isError && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <ErrorState message={errorMessage} />
                </TableCell>
              </TableRow>
            )}

            {/* Empty */}
            {!isLoading && !isError && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState
                    icon={emptyIcon}
                    heading={emptyHeading}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                  />
                </TableCell>
              </TableRow>
            )}

            {/* Data rows */}
            {!isLoading && !isError && data.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      {mobileCard && (
        <div className="md:hidden space-y-3">
          {/* Loading */}
          {isLoading && (
            <LoadingState variant="cards" count={pagination?.pageSize ?? 5} />
          )}

          {/* Error */}
          {!isLoading && isError && (
            <ErrorState message={errorMessage} />
          )}

          {/* Empty */}
          {!isLoading && !isError && data.length === 0 && (
            <EmptyState
              icon={emptyIcon}
              heading={emptyHeading}
              description={emptyDescription}
              actionLabel={emptyActionLabel}
              onAction={onEmptyAction}
            />
          )}

          {/* Data cards */}
          {!isLoading && !isError && data.map((row) => (
            <div
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "rounded-md border bg-card p-4",
                onRowClick && "cursor-pointer hover:bg-accent/50 transition-colors"
              )}
            >
              {mobileCard(row)}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && !isLoading && !isError && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
          {/* Result count */}
          <span className="shrink-0">
            {pagination.total === 0
              ? "No results"
              : `${(currentPage - 1) * pagination.pageSize + 1}–${Math.min(
                  currentPage * pagination.pageSize,
                  pagination.total
                )} of ${pagination.total}`}
          </span>

          <div className="flex flex-wrap items-center gap-3">
            {/* Page size selector */}
            {onPageSizeChange && (
              <div className="flex items-center gap-1.5">
                <span className="shrink-0">Rows per page</span>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {pageSizeOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Page buttons */}
            {onPageChange && totalPages > 1 && (
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange(currentPage - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-1">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onPageChange(p as number)}
                      aria-label={`Page ${p}`}
                      aria-current={p === currentPage ? "page" : undefined}
                    >
                      {p}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage >= totalPages}
                  onClick={() => onPageChange(currentPage + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

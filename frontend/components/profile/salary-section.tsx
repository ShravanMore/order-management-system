"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Coins, TrendingUp } from "lucide-react";

import apiClient from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/shared/error-state";
import type { SalaryBreakdown } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SalarySection() {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });

  const { data: salaryData, isLoading, isError, refetch } = useQuery({
    queryKey: ["salary", selectedDate.year, selectedDate.month],
    queryFn: () =>
      apiClient
        .get<SalaryBreakdown>("/profile/me/salary", {
          params: { year: selectedDate.year, month: selectedDate.month },
        })
        .then((r) => r.data),
    retry: 1,
  });

  const handlePreviousMonth = () => {
    setSelectedDate((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    // Don't allow navigating to future months
    const current = new Date(now.getFullYear(), now.getMonth());
    const selected = new Date(selectedDate.year, selectedDate.month - 1);
    
    if (selected >= current) {
      return;
    }

    setSelectedDate((prev) => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const isCurrentMonth = selectedDate.year === now.getFullYear() && selectedDate.month === now.getMonth() + 1;
  const canGoForward = !isCurrentMonth;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Salary This Month
            </CardTitle>
            <CardDescription>
              Your compensation breakdown for {MONTH_NAMES[selectedDate.month - 1]} {selectedDate.year}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous month</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              disabled={!canGoForward}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : isError ? (
          <ErrorState 
            message="Could not load salary information." 
            onRetry={() => refetch()} 
          />
        ) : !salaryData?.has_salary_setup ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Coins className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-1 font-medium">Compensation Not Set Up</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Your compensation details haven&apos;t been set up yet. Please contact your admin to configure your salary and commission rate.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Base Salary</span>
                <span className="font-medium">{formatCurrency(salaryData.base_salary)} / month</span>
              </div>

              <div className="flex items-start justify-between text-sm">
                <div className="flex-1">
                  <p className="text-muted-foreground">Commission Earned</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {salaryData.completed_orders_count} order{salaryData.completed_orders_count !== 1 ? 's' : ''} · {formatCurrency(salaryData.completed_orders_value)} · {salaryData.commission_rate}% rate
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className="font-medium">{formatCurrency(salaryData.commission_earned)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="font-semibold">Total This Month</span>
                <span className="text-xl font-bold">{formatCurrency(salaryData.total_salary)}</span>
              </div>
            </div>

            {salaryData.completed_orders_count === 0 && (
              <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground">
                  No completed orders this month. Complete orders to earn commission!
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

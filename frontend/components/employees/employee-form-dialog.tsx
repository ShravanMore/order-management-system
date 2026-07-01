"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import apiClient from "@/lib/api-client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Employee } from "@/types";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(255),
  email:     z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone:     z
    .string()
    .regex(/^[+\d\s\-().]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  password:  z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

const editSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(255),
  email:     z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone:     z
    .string()
    .regex(/^[+\d\s\-().]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData   = z.infer<typeof editSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass an employee to edit; undefined = create mode */
  employee?: Employee;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EmployeeFormDialog({ open, onOpenChange, employee }: EmployeeFormDialogProps) {
  const isEdit = !!employee;
  const queryClient = useQueryClient();

  // Use the appropriate schema per mode
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as any,
    defaultValues: { full_name: "", email: "", phone: "", password: "" },
  });

  useEffect(() => {
    if (open) {
      if (employee) {
        reset({
          full_name: employee.full_name,
          email:     employee.email,
          phone:     employee.phone ?? "",
        });
      } else {
        reset({ full_name: "", email: "", phone: "", password: "" });
      }
    }
  }, [open, employee, reset]);

  const mutation = useMutation({
    mutationFn: (data: CreateFormData) => {
      const payload = {
        full_name: data.full_name,
        email:     data.email,
        phone:     data.phone || null,
        ...(isEdit ? {} : { password: data.password }),
      };
      return isEdit
        ? apiClient.put<Employee>(`/employees/${employee!.id}`, payload).then((r) => r.data)
        : apiClient.post<Employee>("/employees", payload).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(isEdit ? "Employee updated successfully." : "Employee created successfully.");
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.detail?.message ?? err.message ?? "Something went wrong.";
      toast.error(msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Employee" : "Add Employee"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the employee's details below."
              : "Fill in the details to create a new employee account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">

          {/* Full name */}
          <div className="space-y-1">
            <Label htmlFor="full_name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input id="full_name" {...register("full_name")} placeholder="e.g. Sarah Johnson" />
            <FieldError message={errors.full_name?.message} />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input id="email" type="email" {...register("email")} placeholder="name@company.com" />
            <FieldError message={errors.email?.message} />
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label htmlFor="phone">
              Phone <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input id="phone" type="tel" {...register("phone")} placeholder="+1-555-0101" />
            <FieldError message={errors.phone?.message} />
          </div>

          {/* Password — create mode only */}
          {!isEdit && (
            <div className="space-y-1">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
              <FieldError message={(errors as any).password?.message} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

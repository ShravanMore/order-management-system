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
import type { Dealer } from "@/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const dealerSchema = z.object({
  name:           z.string().min(1, "Name is required").max(255),
  contact_person: z.string().min(1, "Contact person is required").max(255),
  email:          z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone:          z
    .string()
    .min(1, "Phone is required")
    .regex(/^[+\d\s\-().]{7,20}$/, "Enter a valid phone number"),
  address:        z.string().min(1, "Address is required").max(500),
  city:           z.string().min(1, "City is required").max(100),
  state:          z.string().min(1, "State is required").max(100),
  pincode:        z
    .string()
    .min(1, "Pincode is required")
    .regex(/^\d{4,10}$/, "Enter a valid pincode (4–10 digits)"),
  gst_number:     z
    .string()
    .regex(/^[A-Z0-9]{15}$/, "GST number must be exactly 15 alphanumeric characters")
    .optional()
    .or(z.literal("")),
});

type DealerFormData = z.infer<typeof dealerSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface DealerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a dealer to edit; undefined = create mode */
  dealer?: Dealer;
}

// ─── Field error helper ───────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DealerFormDialog({ open, onOpenChange, dealer }: DealerFormDialogProps) {
  const isEdit = !!dealer;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DealerFormData>({
    resolver: zodResolver(dealerSchema),
    defaultValues: {
      name: "", contact_person: "", email: "", phone: "",
      address: "", city: "", state: "", pincode: "", gst_number: "",
    },
  });

  // Populate form when editing, reset on create
  useEffect(() => {
    if (open) {
      if (dealer) {
        reset({
          name:           dealer.name,
          contact_person: dealer.contact_person,
          email:          dealer.email,
          phone:          dealer.phone,
          address:        dealer.address,
          city:           dealer.city,
          state:          dealer.state,
          pincode:        dealer.pincode,
          gst_number:     dealer.gst_number ?? "",
        });
      } else {
        reset({
          name: "", contact_person: "", email: "", phone: "",
          address: "", city: "", state: "", pincode: "", gst_number: "",
        });
      }
    }
  }, [open, dealer, reset]);

  const mutation = useMutation({
    mutationFn: (data: DealerFormData) => {
      const payload = { ...data, gst_number: data.gst_number || null };
      return isEdit
        ? apiClient.put<Dealer>(`/dealers/${dealer!.id}`, payload).then((r) => r.data)
        : apiClient.post<Dealer>("/dealers", payload).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealers"] });
      toast.success(isEdit ? "Dealer updated successfully." : "Dealer created successfully.");
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
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Dealer" : "Add Dealer"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the dealer details below."
              : "Fill in the details for the new dealer."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">

            {/* Name */}
            <div className="col-span-2 space-y-1">
              <Label htmlFor="name">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" {...register("name")} placeholder="e.g. HealthCare Medical Supplies" />
              <FieldError message={errors.name?.message} />
            </div>

            {/* Contact person */}
            <div className="col-span-2 space-y-1">
              <Label htmlFor="contact_person">
                Contact Person <span className="text-destructive">*</span>
              </Label>
              <Input id="contact_person" {...register("contact_person")} placeholder="Full name" />
              <FieldError message={errors.contact_person?.message} />
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
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input id="phone" type="tel" {...register("phone")} placeholder="+1-555-1001" />
              <FieldError message={errors.phone?.message} />
            </div>

            {/* Address */}
            <div className="col-span-2 space-y-1">
              <Label htmlFor="address">
                Address <span className="text-destructive">*</span>
              </Label>
              <Input id="address" {...register("address")} placeholder="Street address" />
              <FieldError message={errors.address?.message} />
            </div>

            {/* City */}
            <div className="space-y-1">
              <Label htmlFor="city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input id="city" {...register("city")} placeholder="City" />
              <FieldError message={errors.city?.message} />
            </div>

            {/* State */}
            <div className="space-y-1">
              <Label htmlFor="state">
                State <span className="text-destructive">*</span>
              </Label>
              <Input id="state" {...register("state")} placeholder="State" />
              <FieldError message={errors.state?.message} />
            </div>

            {/* Pincode */}
            <div className="space-y-1">
              <Label htmlFor="pincode">
                Pincode <span className="text-destructive">*</span>
              </Label>
              <Input id="pincode" {...register("pincode")} placeholder="e.g. 400001" />
              <FieldError message={errors.pincode?.message} />
            </div>

            {/* GST Number */}
            <div className="space-y-1">
              <Label htmlFor="gst_number">
                GST Number{" "}
                <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="gst_number"
                {...register("gst_number")}
                placeholder="15-char alphanumeric"
                className="uppercase"
              />
              <FieldError message={errors.gst_number?.message} />
            </div>

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Dealer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

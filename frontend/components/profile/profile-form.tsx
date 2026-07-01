"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, UserCircle } from "lucide-react";

import apiClient from "@/lib/api-client";
import { setUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import type { User } from "@/types";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  full_name:  z.string().min(1, "Name is required").max(255),
  phone:      z
    .string()
    .regex(/^[+\d\s\-().]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  avatar_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password:     z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ProfileFormData  = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProfileForm() {
  const queryClient = useQueryClient();

  // ── Fetch current profile ────────────────────────────────────────────────
  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiClient.get<User>("/profile/me").then((r) => r.data),
  });

  // ── Profile form ─────────────────────────────────────────────────────────
  const {
    register: regProfile,
    handleSubmit: handleProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", phone: "", avatar_url: "" },
  });

  // Populate form once data loads
  useEffect(() => {
    if (profile) {
      resetProfile({
        full_name:  profile.full_name,
        phone:      profile.phone ?? "",
        avatar_url: profile.avatar_url ?? "",
      });
    }
  }, [profile, resetProfile]);

  const profileMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      apiClient
        .put<User>("/profile/me", {
          full_name:  data.full_name,
          phone:      data.phone || null,
          avatar_url: data.avatar_url || null,
        })
        .then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // Keep the auth cookie in sync
      setUser(updated);
      toast.success("Profile updated successfully.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message ?? "Failed to update profile.";
      toast.error(msg);
    },
  });

  // ── Password form ─────────────────────────────────────────────────────────
  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { errors: pwErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordFormData) =>
      apiClient
        .put("/profile/me/password", {
          current_password: data.current_password,
          new_password:     data.new_password,
        })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Password changed successfully.");
      resetPassword();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail?.message ?? "Failed to change password.";
      toast.error(msg);
    },
  });

  // ── Loading / error ──────────────────────────────────────────────────────
  if (isLoading) return <LoadingState variant="cards" count={2} />;
  if (isError || !profile) {
    return <ErrorState message="Could not load profile." onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Profile card ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your name, phone number, and avatar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleProfile((d) => profileMutation.mutate(d))}
            className="space-y-5"
          >
            {/* Avatar preview */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
              </div>
            </div>

            <Separator />

            {/* Full name */}
            <div className="space-y-1">
              <Label htmlFor="full_name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input id="full_name" {...regProfile("full_name")} />
              <FieldError message={profileErrors.full_name?.message} />
            </div>

            {/* Email — read-only */}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                readOnly
                className="bg-muted cursor-not-allowed text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <Label htmlFor="phone">
                Phone <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Input id="phone" type="tel" {...regProfile("phone")} placeholder="+1-555-0100" />
              <FieldError message={profileErrors.phone?.message} />
            </div>

            {/* Avatar URL */}
            <div className="space-y-1">
              <Label htmlFor="avatar_url">
                Avatar URL <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Input id="avatar_url" {...regProfile("avatar_url")} placeholder="https://…" />
              <FieldError message={profileErrors.avatar_url?.message} />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Change password card ──────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Choose a strong password that is at least 8 characters long.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handlePassword((d) => passwordMutation.mutate(d))}
            className="space-y-4"
          >
            {/* Current password */}
            <div className="space-y-1">
              <Label htmlFor="current_password">
                Current Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="current_password"
                type="password"
                autoComplete="current-password"
                {...regPassword("current_password")}
              />
              <FieldError message={pwErrors.current_password?.message} />
            </div>

            {/* New password */}
            <div className="space-y-1">
              <Label htmlFor="new_password">
                New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new_password"
                type="password"
                autoComplete="new-password"
                {...regPassword("new_password")}
                placeholder="Min. 8 characters"
              />
              <FieldError message={pwErrors.new_password?.message} />
            </div>

            {/* Confirm password */}
            <div className="space-y-1">
              <Label htmlFor="confirm_password">
                Confirm New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                {...regPassword("confirm_password")}
                placeholder="Repeat new password"
              />
              <FieldError message={pwErrors.confirm_password?.message} />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Change Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}

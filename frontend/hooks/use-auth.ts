"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getUser, clearSession, getUserRole } from "@/lib/auth";
import type { User, UserRole } from "@/types";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from cookies on mount
    const currentUser = getUser();
    const currentRole = getUserRole();
    setUser(currentUser);
    setRole(currentRole);
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    // Clear all auth data
    clearSession();
    setUser(null);
    setRole(null);
    
    // Redirect to login
    router.push("/login");
  }, [router]);

  const refreshUser = useCallback(() => {
    // Refresh user data from cookies
    const currentUser = getUser();
    const currentRole = getUserRole();
    setUser(currentUser);
    setRole(currentRole);
  }, []);

  return {
    user,
    role,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: role === "admin",
    isEmployee: role === "employee",
    logout,
    refreshUser,
  };
}

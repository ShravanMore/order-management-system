import Cookies from "js-cookie";
import type { User, UserRole } from "@/types";

// Cookie names
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

// Token management
export const setTokens = (accessToken: string, refreshToken: string): void => {
  // Set httpOnly-style cookies (secure in production)
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
    expires: 1 / 48, // 30 minutes
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

export const getAccessToken = (): string | undefined => {
  return Cookies.get(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | undefined => {
  return Cookies.get(REFRESH_TOKEN_KEY);
};

export const clearTokens = (): void => {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  Cookies.remove(USER_KEY);
};

// User management
export const setUser = (user: User): void => {
  Cookies.set(USER_KEY, JSON.stringify(user), {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

export const getUser = (): User | null => {
  const userStr = Cookies.get(USER_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

export const getUserRole = (): UserRole | null => {
  const user = getUser();
  return user?.role || null;
};

export const isAdmin = (): boolean => {
  return getUserRole() === "admin";
};

export const isEmployee = (): boolean => {
  return getUserRole() === "employee";
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken() && !!getUser();
};

// Session management
export const clearSession = (): void => {
  clearTokens();
};

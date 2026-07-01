"use client";

import { usePathname } from "next/navigation";

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/orders": "Orders",
  "/products": "Products",
  "/dealers": "Dealers",
  "/employees": "Employees",
  "/profile": "Profile",
};

export function usePageTitle(): string {
  const pathname = usePathname();

  // Exact match first
  if (titleMap[pathname]) return titleMap[pathname];

  // Prefix match (e.g. /orders/123 → "Orders")
  for (const [key, title] of Object.entries(titleMap)) {
    if (pathname.startsWith(key + "/")) return title;
  }

  return "Sadguru Electro Medical";
}

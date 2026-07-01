"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { usePageTitle } from "@/hooks/use-page-title";

export function AppShell({ children }: { children: React.ReactNode }) {
  const title = usePageTitle();

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      {/* Fixed sidebar — desktop only */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        <Topbar title={title} />
        <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

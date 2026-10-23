"use client";

import Link from "next/link";
import { Menu as MenuIcon } from "lucide-react";

import { AccountMenu } from "@/components/app-shell/AccountMenu";
import { MainMenu } from "@/components/app-shell/MainMenu";
import { toggleSidebar, useSidebarCollapsed } from "@/components/app-shell/useSidebar";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

// Large screens only.
export function Sidebar() {
  const collapsed = useSidebarCollapsed();
  const toggleLabel = collapsed ? "Open the sidebar" : "Fold the sidebar";

  return (
    <aside
      id="sidebar"
      className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 motion-reduce:transition-none lg:flex sidebar-collapsed:w-18"
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 pr-3 pl-5 sidebar-collapsed:justify-center sidebar-collapsed:px-0">
        <Link
          href="/"
          aria-label="PharmaZ247 Tracker, go to the dashboard"
          className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sidebar-collapsed:hidden"
        >
          <Logo />
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-controls="sidebar" aria-expanded={!collapsed} aria-label={toggleLabel} title={toggleLabel}>
          <MenuIcon />
        </Button>
      </div>
      <nav aria-label="Main" className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-2">
        <MainMenu />
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <AccountMenu />
      </div>
    </aside>
  );
}

"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Pill, Stethoscope, Users } from "lucide-react";

import { useSidebarCollapsed } from "@/components/app-shell/useSidebar";
import { useUser } from "@/components/app-shell/useUser";
import { cn } from "@/lib/utils";

// The menu (Dashboard, Doctors, Pharmacies, and Team for admins).
const MENU = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/pharmacies", label: "Pharmacies", icon: Pill },
  { href: "/team", label: "Team", icon: Users, adminOnly: true },
];

// Until the current page and the user are known, show the items everyone has, none highlighted.
export function MainMenu({ onNavigate }) {
  const everyoneItems = MENU.filter((item) => !item.adminOnly);
  return (
    <Suspense fallback={<MenuList items={everyoneItems} onNavigate={onNavigate} />}>
      <CurrentMenu onNavigate={onNavigate} />
    </Suspense>
  );
}

function CurrentMenu({ onNavigate }) {
  const pathname = usePathname();
  const user = useUser();
  const items = MENU.filter((item) => !item.adminOnly || user?.role === "admin");
  const active = items.find((item) => isCurrentPage(item.href, pathname));
  return <MenuList items={items} activeHref={active?.href} onNavigate={onNavigate} />;
}

// "/" only matches the dashboard itself; "/doctors" also matches "/doctors/…".
function isCurrentPage(href, pathname) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// In the folded sidebar only the icons show. The names stay for screen readers,
// and appear as a tooltip on hover.
function MenuList({ items, activeHref, onNavigate }) {
  const collapsed = useSidebarCollapsed();
  return (
    <ul className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = href === activeHref;
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sidebar-collapsed:justify-center sidebar-collapsed:px-0",
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4.5 shrink-0", isActive && "text-primary")} aria-hidden="true" />
              <span className="sidebar-collapsed:sr-only">{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

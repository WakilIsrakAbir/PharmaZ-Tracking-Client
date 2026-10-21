"use client";

// The frame around every signed-in page:
//   • large screens: a sidebar with the logo, the menu and the account button
//   • phones: a top bar with a menu button, the logo and the account button
// It also shares the signed-in user with every page (see useUser below).

import { Suspense, createContext, use, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, LayoutDashboard, LogOut, Menu as MenuIcon, Pill, Stethoscope, UserRound, Users } from "lucide-react";

import { Avatar } from "@/components/common";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MENU = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/pharmacies", label: "Pharmacies", icon: Pill },
  { href: "/team", label: "Team", icon: Users, adminOnly: true },
];

// ---------------------------------------------------------------------------
// The signed-in user
// ---------------------------------------------------------------------------
const UserContext = createContext(null);

// The signed-in user (or null) in any client component. Call it inside <Suspense>.
export function useUser() {
  const userPromise = use(UserContext);
  return userPromise ? use(userPromise) : null;
}

// ---------------------------------------------------------------------------
// The frame
// ---------------------------------------------------------------------------
export function AppShell({ userPromise, children }) {
  return (
    <UserContext value={userPromise}>
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main className="mx-auto w-full max-w-360 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </UserContext>
  );
}

// Large screens only.
function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center px-5">
        <Link href="/" aria-label="PharmaZ247 Tracker, go to the dashboard" className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Logo />
        </Link>
      </div>
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-2">
        <MainMenu />
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <AccountMenu />
      </div>
    </aside>
  );
}

// Phones and tablets only.
function TopBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-2 backdrop-blur-md lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open the menu">
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 gap-0 p-0">
          <SheetHeader className="h-14 justify-center border-b px-5">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Logo />
          </SheetHeader>
          <nav aria-label="Main" className="px-3 py-4">
            <MainMenu onNavigate={() => setOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>

      <Link href="/" aria-label="PharmaZ247 Tracker, go to the dashboard">
        <Logo />
      </Link>

      <div className="ml-auto pr-1">
        <AccountMenu compact />
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// The menu (Dashboard, Doctors, Pharmacies, and Team for admins)
// ---------------------------------------------------------------------------

// Until the current page and the user are known, show the items everyone has, none highlighted.
function MainMenu({ onNavigate }) {
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

function MenuList({ items, activeHref, onNavigate }) {
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
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4.5", isActive && "text-primary")} aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// The account button: name and role, "Your account", "Sign out".
// `compact` shows only the round avatar (phone top bar).
// ---------------------------------------------------------------------------
function AccountMenu({ compact = false }) {
  const placeholder = compact ? <Skeleton className="size-9 rounded-full" /> : <Skeleton className="h-12 w-full rounded-lg" />;
  return (
    <Suspense fallback={placeholder}>
      <AccountMenuButton compact={compact} />
    </Suspense>
  );
}

function AccountMenuButton({ compact }) {
  const user = useUser();
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Your account"
        className={cn(
          "flex items-center gap-3 rounded-lg text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted",
          compact ? "p-0.5" : "w-full p-2",
        )}
      >
        <Avatar name={user.name} />
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{ROLES[user.role].label}</span>
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={compact ? "bottom" : "top"} className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate font-semibold text-foreground">{user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserRound /> Your account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={signOut}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Signing out reloads the whole page on purpose: Next.js keeps recently visited pages
// alive in memory, and a full load clears them so nothing from this user stays behind.
async function signOut() {
  try {
    await api("/auth/logout", { method: "POST" });
  } finally {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload is the point
    window.location.assign("/login");
  }
}

"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";

import { useSidebarCollapsed } from "@/components/app-shell/useSidebar";
import { useUser } from "@/components/app-shell/useUser";
import { Avatar } from "@/components/shared/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// The account button: name and role, "Your account", "Sign out".
// `compact` shows only the round avatar (phone top bar). In the folded sidebar it is only the avatar too.
export function AccountMenu({ compact = false }) {
  const placeholder = compact ? <Skeleton className="size-9 rounded-full" /> : <Skeleton className="h-12 w-full rounded-lg sidebar-collapsed:size-12" />;
  return (
    <Suspense fallback={placeholder}>
      <AccountMenuButton compact={compact} />
    </Suspense>
  );
}

function AccountMenuButton({ compact }) {
  const user = useUser();
  const collapsed = useSidebarCollapsed();
  if (!user) return null;

  // Opens below the phone's avatar, to the right of the folded sidebar, or above the open one.
  let side = "top";
  if (compact) side = "bottom";
  else if (collapsed) side = "right";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Your account"
        title={collapsed && !compact ? "Your account" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted",
          compact ? "p-0.5" : "w-full p-2 sidebar-collapsed:justify-center sidebar-collapsed:p-1.5",
        )}
      >
        <Avatar name={user.name} />
        {!compact && (
          <>
            <span className="min-w-0 flex-1 sidebar-collapsed:hidden">
              <span className="block truncate text-sm font-semibold">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{ROLES[user.role].label}</span>
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground sidebar-collapsed:hidden" aria-hidden="true" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={side} sideOffset={side === "right" ? 16 : 4} className="w-60">
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

"use client";

import { ShieldCheck } from "lucide-react";

import { Avatar } from "@/components/shared/Avatar";
import { UserActions } from "@/components/team/UserActions";
import { Badge } from "@/components/ui/badge";
import { ROLES } from "@/lib/constants";
import { formatPhone, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

// The columns of the list on large screens (the header row in TeamPage.jsx uses them too).
export const COLUMNS = "md:grid-cols-[minmax(0,2.2fr)_7rem_minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_2.5rem]";

// One person. On phones the role and status go under the name.
export function UserRow({ user, isMe }) {
  return (
    <li className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3", COLUMNS)}>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={user.name} />
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium">
            <span className="truncate">{user.name}</span>
            {isMe && (
              <Badge variant="outline" className="h-5 px-1.5 text-[0.7rem]">
                You
              </Badge>
            )}
          </p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="col-start-1 row-start-2 flex flex-wrap items-center gap-3 md:contents">
        <RoleBadge role={user.role} />
        <span className="hidden text-sm text-muted-foreground tabular-nums md:block">{user.phone ? formatPhone(user.phone) : "—"}</span>
        <AccountStatus user={user} />
        <span className="hidden text-sm text-muted-foreground md:block">{timeAgo(user.lastLoginAt)}</span>
      </div>
      <div className="col-start-2 row-span-2 row-start-1 justify-self-end md:col-start-auto md:row-span-1 md:row-start-auto">
        <UserActions user={user} isMe={isMe} />
      </div>
    </li>
  );
}

function RoleBadge({ role }) {
  return (
    <Badge variant={role === "admin" ? "default" : "secondary"} className="w-fit">
      {role === "admin" && <ShieldCheck aria-hidden="true" />}
      {ROLES[role].label}
    </Badge>
  );
}

// What an admin needs to know about an account, in plain words.
function accountStatus(user) {
  if (!user.isActive) return { label: "Deactivated", dot: "bg-muted-foreground/40" };
  if (user.mustChangePassword && !user.lastLoginAt) return { label: "Hasn't signed in yet", dot: "bg-status-setup" };
  if (user.mustChangePassword) return { label: "Password was reset", dot: "bg-status-setup" };
  return { label: "Active", dot: "bg-status-implementation" };
}

function AccountStatus({ user }) {
  const { label, dot } = accountStatus(user);
  return (
    <span className="inline-flex items-center gap-2 text-sm whitespace-nowrap">
      <span className={cn("size-2 rounded-full", dot)} aria-hidden="true" />
      {label}
    </span>
  );
}

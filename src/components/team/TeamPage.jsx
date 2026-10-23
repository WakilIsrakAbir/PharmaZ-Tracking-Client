"use client";

// /team (admins only): everyone who can sign in, with search and Active / Deactivated tabs.
// The add, edit, reset and deactivate actions are in TeamDialogs.jsx.

import { useState } from "react";
import { Search, ShieldCheck, TriangleAlert, UserPlus, Users } from "lucide-react";

import { useUser } from "@/components/app-shell/useUser";
import { Avatar, EmptyState, PageHeader } from "@/components/shared/common";
import { TeammateDialog, UserActions } from "@/components/team/TeamDialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUsers } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { formatPhone, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

// The columns of the list on large screens.
const COLUMNS = "md:grid-cols-[minmax(0,2.2fr)_7rem_minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_2.5rem]";

export function TeamPage() {
  const me = useUser();
  const { data: users = [], isPending, isError, isSuccess, refetch } = useUsers();
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const activeCount = users.filter((user) => user.isActive).length;
  const shownUsers = users
    .filter((user) => (tab === "active" ? user.isActive : !user.isActive))
    .filter((user) => matchesSearch(user, search));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Everyone who can sign in to the tracker. Only admins can add people or change their access."
        actions={
          <Button onClick={() => setAdding(true)}>
            <UserPlus /> Add teammate
          </Button>
        }
      />

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="active">
                Active <Count value={activeCount} />
              </TabsTrigger>
              <TabsTrigger value="deactivated">
                Deactivated <Count value={users.length - activeCount} />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or phone"
              aria-label="Search the team"
              className="pl-9"
            />
          </div>
        </div>

        {isPending && <RowsSkeleton />}

        {isError && (
          <EmptyState
            className="m-3 border-none"
            icon={TriangleAlert}
            title="We couldn't load the team"
            description="Check your connection and try again."
            action={
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            }
          />
        )}

        {isSuccess && shownUsers.length === 0 && <NoOneShown search={search.trim()} tab={tab} />}

        {isSuccess && shownUsers.length > 0 && (
          <ul className="divide-y">
            <li className={cn("hidden gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground md:grid", COLUMNS)}>
              <span>Person</span>
              <span>Role</span>
              <span>Phone</span>
              <span>Status</span>
              <span>Last sign-in</span>
              <span />
            </li>
            {shownUsers.map((user) => (
              <UserRow key={user.id} user={user} isMe={user.id === me?.id} />
            ))}
          </ul>
        )}
      </section>

      <TeammateDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}

// One person. On phones the role and status go under the name.
function UserRow({ user, isMe }) {
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

// Name or email contains the text, or the phone contains the digits ("01711" finds +8801711…).
function matchesSearch(user, search) {
  const text = search.trim().toLowerCase();
  if (!text) return true;
  const digits = text.replace(/\D/g, "").replace(/^0/, "");
  if (user.name.toLowerCase().includes(text) || user.email.includes(text)) return true;
  return digits.length >= 3 && Boolean(user.phone?.includes(digits));
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

function NoOneShown({ search, tab }) {
  if (search) {
    return <EmptyState className="m-3 border-none" icon={Search} title={`No one matches "${search}"`} description="Try a different name, email or phone number." />;
  }
  if (tab === "active") {
    return <EmptyState className="m-3 border-none" icon={Users} title="No active teammates" description="Add your first teammate to get started." />;
  }
  return (
    <EmptyState
      className="m-3 border-none"
      icon={Users}
      title="No deactivated accounts"
      description="People you deactivate show up here. You can reactivate them at any time."
    />
  );
}

function Count({ value }) {
  return <span className="ml-1 rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">{value}</span>;
}

function RowsSkeleton() {
  return (
    <div className="divide-y" aria-busy="true" aria-label="Loading the team">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3 p-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      ))}
    </div>
  );
}

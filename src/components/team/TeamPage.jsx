"use client";

// /team (admins only): everyone who can sign in, one page at a time, with Active / Deactivated tabs,
// a search box, a role filter and the order. The view lives in the address (?status=deactivated&page=2).
// The add, edit, reset and deactivate actions are in TeamDialogs.jsx.

import { useDeferredValue, useEffect, useState } from "react";
import { FilterX, Search, ShieldCheck, TriangleAlert, UserPlus, Users } from "lucide-react";

import { useUser } from "@/components/app-shell/useUser";
import { Avatar, EmptyState, PAGE_SIZES, PageHeader, Pagination, Select } from "@/components/shared/common";
import { TeammateDialog, UserActions } from "@/components/team/TeamDialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUsers } from "@/lib/api";
import { ROLES, ROLE_BADGE } from "@/lib/constants";
import { formatPhone, timeAgo } from "@/lib/format";
import { useUrlParams } from "@/lib/useUrlParams";
import { cn } from "@/lib/utils";

const DEFAULT_LIMIT = 20;

// The order of the list. The empty value is the API's own default.
const SORTS = [
  { value: "", label: "Name, A to Z" },
  { value: "last_login", label: "Last sign-in first" },
  { value: "newest", label: "Newest first" },
];

// The columns of the list on large screens.
const COLUMNS = "md:grid-cols-[minmax(0,2.2fr)_7rem_minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_2.5rem]";

export function TeamPage() {
  const me = useUser();
  const [params, setParams] = useUrlParams();
  const [adding, setAdding] = useState(false);

  // The view, read from the address.
  const tab = params.get("status") === "deactivated" ? "deactivated" : "active";
  const role = params.get("role") ?? "";
  const sort = params.get("sort") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const limit = PAGE_SIZES.includes(Number(params.get("limit"))) ? Number(params.get("limit")) : DEFAULT_LIMIT;

  // Typing shows at once; the list follows a moment later, so not every keystroke asks the API.
  const [search, setSearch] = useState(params.get("q") ?? "");
  const query = useDeferredValue(search.trim());
  const filtering = Boolean(query || role);

  // Changing a filter goes back to the first page.
  function change(changes) {
    setParams({ ...changes, page: null });
  }

  function clearFilters() {
    setSearch("");
    change({ q: null, role: null });
  }

  function goToPage(next) {
    setParams({ page: next > 1 ? next : null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const { data, isPending, isError, isFetching, refetch } = useUsers({
    search: query,
    role,
    active: tab === "active" ? "true" : "false",
    sort,
    page,
    limit,
  });
  const users = data?.data ?? [];
  const meta = data?.meta;
  const counts = meta?.counts;

  // A page that no longer exists (after a deactivation, or an old link): go to the last page there is.
  useEffect(() => {
    if (meta && meta.pages > 0 && page > meta.pages) setParams({ page: meta.pages > 1 ? meta.pages : null });
  }, [meta, page, setParams]);

  return (
    // The page reaches the very bottom of the screen (it takes over the page's bottom padding, under
    // the top bar on phones), and the list's card fills it, so the page bar touches the bottom edge
    // even when the team is small.
    <div className="-mb-6 flex min-h-[calc(100dvh-5rem)] flex-col gap-6 lg:-mb-8 lg:min-h-[calc(100dvh-2rem)]">
      <PageHeader
        title="Team"
        description="Everyone who can sign in to the tracker. Only admins can add people or change their access."
        actions={
          <Button onClick={() => setAdding(true)}>
            <UserPlus /> Add teammate
          </Button>
        }
      />

      {/* No bottom edge: the card ends at the screen's edge, with the page bar as its last row. */}
      <section className="flex flex-1 flex-col overflow-clip rounded-t-xl border border-b-0 bg-card">
        {/* The Active / Deactivated tabs and the search box */}
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onValueChange={(value) => change({ status: value === "active" ? null : value })}>
            <TabsList>
              <TabsTrigger value="active">
                Active <Count value={counts?.active} />
              </TabsTrigger>
              <TabsTrigger value="deactivated">
                Deactivated <Count value={counts?.deactivated} />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                change({ q: event.target.value.trim() });
              }}
              placeholder="Search name, email or phone"
              aria-label="Search the team"
              className="pl-9"
            />
          </div>
        </div>

        {/* The filters: the role, and the order */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-muted/30 px-3 py-2">
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            Role
            <Select compact active={Boolean(role)} value={role} onChange={(event) => change({ role: event.target.value })} aria-label="Role">
              <option value="">All roles</option>
              {Object.entries(ROLES).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground sm:ml-auto">
            Sort
            <Select compact value={sort} onChange={(event) => change({ sort: event.target.value })} aria-label="Sort">
              {SORTS.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </Select>
          </label>
          {filtering && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <FilterX /> Clear
            </Button>
          )}
        </div>

        {/* The rows take the room that is left, so the page bar under them stays at the bottom. */}
        <div className="flex-1">
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

          {data && users.length === 0 && <NoOneShown filtering={filtering} tab={tab} onClear={clearFilters} />}

          {data && users.length > 0 && (
            // While another page or filter loads, the rows on screen fade a little instead of vanishing.
            <ul className={cn("divide-y transition-opacity", isFetching && "opacity-60")} aria-busy={isFetching}>
              <li className={cn("hidden gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground md:grid", COLUMNS)}>
                <span>Person</span>
                <span>Role</span>
                <span>Phone</span>
                <span>Status</span>
                <span>Last sign-in</span>
                <span />
              </li>
              {users.map((user) => (
                <UserRow key={user.id} user={user} isMe={user.id === me?.id} />
              ))}
            </ul>
          )}
        </div>
        {!isError && <Pagination meta={meta} onPage={goToPage} onLimit={(next) => change({ limit: next === DEFAULT_LIMIT ? null : next })} />}
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

function RoleBadge({ role }) {
  return (
    <Badge variant={ROLE_BADGE[role]} className="w-fit">
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

function NoOneShown({ filtering, tab, onClear }) {
  if (filtering) {
    return (
      <EmptyState
        className="m-3 border-none"
        icon={Search}
        title="No one matches"
        description="Try a different name, email, phone number or role."
        action={
          <Button variant="outline" onClick={onClear}>
            <FilterX /> Clear filters
          </Button>
        }
      />
    );
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
  return <span className="ml-1 rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">{value ?? "–"}</span>;
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

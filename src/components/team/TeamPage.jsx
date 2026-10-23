"use client";

// /team (admins only): everyone who can sign in, with search and Active / Deactivated tabs.
// The add, edit, reset and deactivate actions are in TeammateDialog.jsx and UserActions.jsx.

import { useState } from "react";
import { Search, TriangleAlert, UserPlus } from "lucide-react";

import { useUser } from "@/components/app-shell/useUser";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { NoOneShown } from "@/components/team/NoOneShown";
import { RowsSkeleton } from "@/components/team/RowsSkeleton";
import { TeammateDialog } from "@/components/team/TeammateDialog";
import { COLUMNS, UserRow } from "@/components/team/UserRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUsers } from "@/lib/api";
import { cn } from "@/lib/utils";

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

// Name or email contains the text, or the phone contains the digits ("01711" finds +8801711…).
function matchesSearch(user, search) {
  const text = search.trim().toLowerCase();
  if (!text) return true;
  const digits = text.replace(/\D/g, "").replace(/^0/, "");
  if (user.name.toLowerCase().includes(text) || user.email.includes(text)) return true;
  return digits.length >= 3 && Boolean(user.phone?.includes(digits));
}

function Count({ value }) {
  return <span className="ml-1 rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">{value}</span>;
}

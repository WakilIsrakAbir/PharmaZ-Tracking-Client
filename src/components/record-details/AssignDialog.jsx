"use client";

// Admins only: choose which teammates are assigned to a form. Each newly assigned person is
// emailed the whole form by the API (when email is set up on the server).

import { useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { toast } from "sonner";

import { Avatar } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssign, useUsers } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export function AssignDialog({ open, onOpenChange, record }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* A dialog only shows its content while open, so the choices start from the record every time. */}
        <AssignForm record={record} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AssignForm({ record, onDone }) {
  const { data: users = [], isPending } = useUsers();
  const assign = useAssign(record.type);
  const [chosen, setChosen] = useState(() => new Set(record.assignedTo.map((person) => person.id)));
  const [search, setSearch] = useState("");

  // Only active accounts can be assigned; someone already assigned but since deactivated stays listed, so they can be removed.
  const people = users.filter((user) => user.isActive || chosen.has(user.id)).filter((user) => matchesSearch(user, search));

  function toggle(id) {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChosen(next);
  }

  async function save() {
    try {
      const { meta } = await assign.mutateAsync({ id: record.id, userIds: [...chosen] });
      toast.success(emailSummary(meta.email));
      onDone();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <div className="grid gap-5">
      <DialogHeader>
        <DialogTitle>Assign teammates</DialogTitle>
        <DialogDescription>They&apos;ll see {record.name} in their lists and on the calendar, and each newly assigned person gets the form by email.</DialogDescription>
      </DialogHeader>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or email"
          aria-label="Search teammates"
          className="pl-9"
          autoFocus
        />
      </div>

      <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border" aria-label="Teammates">
        {isPending &&
          [0, 1, 2].map((row) => (
            <li key={row} className="flex items-center gap-3 p-3">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </li>
          ))}
        {!isPending && people.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No one matches.</li>}
        {people.map((user) => (
          <li key={user.id}>
            <label className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-muted/50 has-checked:bg-secondary/60">
              <input type="checkbox" checked={chosen.has(user.id)} onChange={() => toggle(user.id)} className="size-4 shrink-0 accent-primary" />
              <Avatar name={user.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {user.name}
                  {!user.isActive && <span className="ml-2 text-xs font-normal text-muted-foreground">Deactivated</span>}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {user.email} · {ROLES[user.role].label}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={assign.isPending}>
          Cancel
        </Button>
        <Button type="button" onClick={save} disabled={assign.isPending}>
          {assign.isPending && <LoaderCircle className="animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </div>
  );
}

function matchesSearch(user, search) {
  const text = search.trim().toLowerCase();
  return !text || user.name.toLowerCase().includes(text) || user.email.includes(text);
}

// What to tell the admin after saving: who got the email, who didn't, or that email isn't set up.
function emailSummary({ configured, sent, failed }) {
  if (sent.length === 0 && failed.length === 0) return "Assignments saved.";
  if (!configured) return "Assignments saved. Email isn't set up on the server, so no one was emailed.";
  const parts = ["Assignments saved."];
  if (sent.length) parts.push(`Emailed ${sent.join(", ")}.`);
  if (failed.length) parts.push(`The email to ${failed.join(", ")} couldn't be sent.`);
  return parts.join(" ");
}

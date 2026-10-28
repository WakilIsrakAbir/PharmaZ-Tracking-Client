"use client";

// Admins only: choose who is assigned to a form. Teammates are ticked from the list; anyone outside
// the team is added by email address, with a name. Each newly assigned person is emailed the whole
// form by the API (when email is set up on the server), and everyone assigned gets each later edit.

import { useState } from "react";
import { LoaderCircle, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssign, useUsers } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { emailSummary } from "@/lib/format";

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
  const { data, isPending } = useUsers({ limit: 100 }); // the whole team, A to Z
  const users = data?.data ?? [];
  const assign = useAssign(record.type);
  // The chosen people, by email address: teammates ticked in the list (their name comes from their
  // account), and outside addresses typed in with a name.
  const [chosen, setChosen] = useState(() => new Map(record.assignedTo.map((person) => [person.email, person.teammate ? "" : person.name])));
  const [search, setSearch] = useState("");
  const [outside, setOutside] = useState({ email: "", name: "" });
  const [outsideError, setOutsideError] = useState(null);

  const teamEmails = new Set(users.map((user) => user.email));
  const outsiders = [...chosen].filter(([email]) => !teamEmails.has(email));
  // Only active accounts can be ticked; someone already assigned but since deactivated stays listed, so they can be removed.
  const people = users.filter((user) => user.isActive || chosen.has(user.email)).filter((user) => matchesSearch(user, search));

  function toggleTeammate(email) {
    const next = new Map(chosen);
    if (next.has(email)) next.delete(email);
    else next.set(email, "");
    setChosen(next);
  }

  function removeOutsider(email) {
    const next = new Map(chosen);
    next.delete(email);
    setChosen(next);
  }

  // What is typed in the outside boxes: { email, name } when it can be added, else { error } saying why not.
  function readOutsider() {
    const email = outside.email.trim().toLowerCase();
    const name = outside.name.trim();
    if (!email) return { error: `Enter ${name ? `${name}'s` : "the"} email address too.` };
    if (!EMAIL_SHAPE.test(email)) return { error: "That doesn't look like an email address. It should be like name@example.com." };
    if (teamEmails.has(email)) return { error: "That's a teammate: tick them in the list above." };
    return { email, name };
  }

  // "Add": puts the outside person among the chosen. Returns the new choices, or null when the boxes are wrong.
  function addOutsider() {
    const person = readOutsider();
    if (person.error) {
      setOutsideError(person.error);
      return null;
    }
    const next = new Map(chosen).set(person.email, person.name);
    setChosen(next);
    setOutside({ email: "", name: "" });
    setOutsideError(null);
    return next;
  }

  async function save() {
    let choices = chosen;
    // Typed an outside person but didn't press Add? Add them now, so the save doesn't quietly leave them out.
    if (outside.email.trim() || outside.name.trim()) {
      choices = addOutsider();
      if (!choices) {
        toast.error(`Nothing was saved. ${readOutsider().error}`);
        return;
      }
    }
    if (signature(choices) === signature(record.assignedTo.map((person) => [person.email, person.teammate ? "" : person.name]))) {
      toast.message("Nothing changed: the same people are assigned.");
      onDone();
      return;
    }

    const assignees = [...choices].map(([email, name]) => (name ? { email, name } : { email }));
    try {
      const { data: saved, meta } = await assign.mutateAsync({ id: record.id, assignees });
      const first = saved.assignedTo.length === 0 ? `No one is assigned to ${record.name} now.` : `Assigned: ${saved.assignedTo.map((person) => person.name).join(", ")}.`;
      // In red, with the reason, when someone who should have been emailed wasn't.
      const email = emailSummary(first, meta?.email);
      if (email.problem) toast.error(email.text, { duration: 10_000 });
      else toast.success(email.text);
      onDone();
    } catch (error) {
      // The API's own words, with the field it complained about when there is one.
      const detail = Object.values(error.fields ?? {})[0] ?? error.message;
      toast.error(`Couldn't save the assignments: ${detail}`, { duration: 10_000 });
    }
  }

  return (
    <div className="grid gap-5">
      <DialogHeader>
        <DialogTitle>Assign people</DialogTitle>
        <DialogDescription>
          Teammates will see {record.name} in their lists and on the calendar. Anyone else just gets the form by email. Everyone assigned is emailed each time the form is edited.
        </DialogDescription>
      </DialogHeader>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search teammates"
          aria-label="Search teammates"
          className="pl-9"
          autoFocus
        />
      </div>

      <ul className="max-h-52 divide-y overflow-y-auto rounded-lg border" aria-label="Teammates">
        {isPending &&
          [0, 1, 2].map((row) => (
            <li key={row} className="flex items-center gap-3 p-3">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </li>
          ))}
        {!isPending && people.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No teammate matches.</li>}
        {people.map((user) => (
          <li key={user.id}>
            <label className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-muted/50 has-checked:bg-secondary/60">
              <input type="checkbox" checked={chosen.has(user.email)} onChange={() => toggleTeammate(user.email)} className="size-4 shrink-0 accent-primary" />
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

      {/* Anyone outside the team: a name on one row, the email address and "Add" on the next. The name
          is saved with the form and shown wherever the assigned people are listed; the email is where
          the form is sent. */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Someone outside the team</p>
        <Input
          value={outside.name}
          onChange={(event) => setOutside({ ...outside, name: event.target.value })}
          placeholder="Name"
          aria-label="Name of someone outside the team"
          maxLength={80}
        />
        <div className="flex gap-2">
          <Input
            type="email"
            inputMode="email"
            value={outside.email}
            onChange={(event) => {
              setOutside({ ...outside, email: event.target.value });
              setOutsideError(null);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              addOutsider();
            }}
            placeholder="name@example.com"
            aria-label="Email address of someone outside the team"
            aria-invalid={outsideError ? true : undefined}
            className="min-w-0 flex-1"
          />
          <Button type="button" variant="outline" onClick={addOutsider} disabled={!outside.email.trim()}>
            <Plus /> Add
          </Button>
        </div>
        {outsideError && <p className="text-sm text-destructive">{outsideError}</p>}
        {outsiders.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="People outside the team">
            {outsiders.map(([email, name]) => (
              <li key={email} className="inline-flex items-center gap-1.5 rounded-full border bg-secondary py-1 pr-1.5 pl-2.5 text-xs font-medium" title={email}>
                <span className="truncate">{name || email}</span>
                {name && <span className="truncate font-normal text-muted-foreground">{email}</span>}
                <button
                  type="button"
                  onClick={() => removeOutsider(email)}
                  aria-label={`Remove ${name || email}`}
                  className="rounded-full p-0.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

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

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The chosen people as one comparable string ("a@x.com:|b@y.com:Rafi"), to tell whether anything changed.
const signature = (entries) =>
  [...entries]
    .map(([email, name]) => `${email}:${name}`)
    .sort()
    .join("|");

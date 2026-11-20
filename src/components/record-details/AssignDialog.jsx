"use client";

// Admins only: choose people. Teammates are ticked from the list; anyone outside the team is added by
// email address, with a name. Three uses:
//   AssignDialog record                 the onboarding team: they see the form and get its changes by
//                                       email, but go on no visit until chosen in Who goes (no email)
//   AssignDialog record visit           who goes on one visit (an item of record.visits): only the
//                                       people ticked go; the onboarding team is listed first, with
//                                       "Tick the onboarding team"
//   AssignDialog record pick            who goes on the visit the update box is setting: nothing is
//                                       saved here, pick.onPick(people, or null for nobody) hands it back
// The API emails each person newly going on a visit, unless the visit is over.

import { useState } from "react";
import { LoaderCircle, Plus, Search, Users, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssign, useAssignVisit, useUsers } from "@/lib/api";
import { ROLES, STATUSES } from "@/lib/constants";
import { dhakaDateTime, emailSummary, formatDate, formatTimeRange } from "@/lib/format";
import { cn } from "@/lib/utils";

// `pick`: { day, people (or null for nobody), onPick }.
export function AssignDialog({ open, onOpenChange, record, visit, pick }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* A dialog only shows its content while open, so the choices start from the record every time. */}
        <AssignForm record={record} visit={visit} pick={pick} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

// The people as the dialog keeps them: email → name typed for an outside address ("" for a teammate).
const toChoices = (people) => new Map((people ?? []).map((person) => [person.email, person.teammate ? "" : person.name]));

// "Tue 17 Nov"
const dayLabel = (day) => formatDate(dhakaDateTime(day, "12:00"), "EEE d MMM");

function AssignForm({ record, visit, pick, onDone }) {
  const { data, isPending } = useUsers({ limit: 100 }); // the whole team, A to Z
  const users = data?.data ?? [];
  const assign = useAssign(record.type);
  const assignVisit = useAssignVisit(record.type);
  const saving = assign.isPending || assignVisit.isPending;
  const day = pick?.day ?? visit?.day ?? null; // choosing for one visit
  const start = pick ? (pick.people ?? []) : visit ? visit.assignedTo : record.assignedTo;
  // The chosen people, by email address: teammates ticked in the list (their name comes from their
  // account), and outside addresses typed in with a name.
  const [chosen, setChosen] = useState(() => toChoices(start));
  const [search, setSearch] = useState("");
  const [outside, setOutside] = useState({ email: "", name: "" });
  const [outsideError, setOutsideError] = useState(null);

  const teamEmails = new Set(users.map((user) => user.email));
  // For a visit, the onboarding team comes first in the list, marked "Team": its teammates, and the
  // people outside the team on it (no account, so they aren't among the users), to tick one by one.
  const onboarding = new Set(record.assignedTo.map((person) => person.email));
  const teamOutsiders = day && !isPending ? record.assignedTo.filter((person) => !teamEmails.has(person.email)) : [];
  const listed = new Set(teamOutsiders.map((person) => person.email));
  // The rows of the list: { key, email, name, role?, isActive?, outside, onTeam }. Only active accounts
  // can be ticked; someone already chosen but since deactivated stays listed, so they can be removed.
  const people = [
    ...teamOutsiders.map(({ email, name }) => ({ key: email, email, name, outside: true, onTeam: true })),
    ...users
      .filter((user) => user.isActive || chosen.has(user.email))
      .map((user) => ({ ...user, key: user.id, outside: false, onTeam: Boolean(day) && onboarding.has(user.email) })),
  ]
    .filter((row) => matchesSearch(row, search))
    .sort((a, b) => Number(b.onTeam) - Number(a.onTeam));
  // Typed-in outside people (shown under "Someone outside the team"), not the ones in the list.
  const outsiders = [...chosen].filter(([email]) => !teamEmails.has(email) && !listed.has(email));
  const teamNotAllTicked = Boolean(day) && record.assignedTo.some((person) => !chosen.has(person.email));

  // "Tick the onboarding team": everyone on it goes on this visit too (outside people with their name).
  function tickOnboardingTeam() {
    const next = new Map(chosen);
    for (const person of record.assignedTo) if (!next.has(person.email)) next.set(person.email, person.teammate ? "" : person.name);
    setChosen(next);
  }

  // Tick or untick a row of the list (someone outside the team keeps their name).
  function toggle(row) {
    const next = new Map(chosen);
    if (next.has(row.email)) next.delete(row.email);
    else next.set(row.email, row.outside ? row.name : "");
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
    if (listed.has(email)) return { error: "They're on the onboarding team: tick them in the list above." };
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

  // The choices for the API (a teammate by address, someone outside with their name), and for the
  // update box (with the names to show).
  const toApi = (choices) => [...choices].map(([email, name]) => (name ? { email, name } : { email }));
  function toPeople(choices) {
    return [...choices].map(([email, name]) => {
      const user = users.find((person) => person.email === email);
      return user ? { email, name: user.name, teammate: true } : { email, name: name || email, teammate: false };
    });
  }

  // Says what was saved, and in red, with the reason, when someone who should have been emailed wasn't.
  function report(first, meta) {
    const email = emailSummary(first, meta?.email);
    if (email.problem) toast.error(email.text, { duration: 10_000 });
    else toast.success(email.text);
  }

  // The API's own words, with the field it complained about when there is one.
  function failed(error) {
    const detail = Object.values(error.fields ?? {})[0] ?? error.message;
    toast.error(`Couldn't save who is assigned: ${detail}`, { duration: 10_000 });
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
    if (pick) {
      pick.onPick(choices.size ? toPeople(choices) : null); // nobody ticked: nobody goes
      onDone();
      return;
    }
    if (signature(choices) === signature(toChoices(start))) {
      toast.message(day ? "Nothing changed: the same people go." : "Nothing changed: the same people are assigned.");
      onDone();
      return;
    }

    try {
      if (day) {
        const { data: saved, meta } = await assignVisit.mutateAsync({ id: record.id, day, assignees: toApi(choices) });
        const now = saved.visits.find((item) => item.day === day);
        report(now?.assignedTo.length ? `Going on ${dayLabel(day)}: ${namesOf(now.assignedTo)}.` : `No one is going on ${dayLabel(day)} now.`, meta);
      } else {
        const { data: saved, meta } = await assign.mutateAsync({ id: record.id, assignees: toApi(choices) });
        report(saved.assignedTo.length === 0 ? `No one is on the onboarding team of ${record.name} now.` : `Onboarding team: ${namesOf(saved.assignedTo)}.`, meta);
      }
      onDone();
    } catch (error) {
      failed(error);
    }
  }

  const visitLine = visit ? `${STATUSES[visit.status]?.label} · ${formatTimeRange(visit.visitDate, visit.visitEndDate)}. ` : "";
  return (
    <div className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{day ? `Who goes on ${dayLabel(day)}?` : "Onboarding team"}</DialogTitle>
        <DialogDescription>
          {day
            ? `${visitLine}Only the people ticked go on this visit. Teammates see it on their calendar; people outside the team only get the email. Each person newly going is emailed (not for a visit that is over).`
            : `They see ${record.name || "it"} in their lists and on the calendar, and are emailed its changes. They go on a visit only when chosen in Who goes; joining the team sends no email.`}
        </DialogDescription>
      </DialogHeader>

      {teamNotAllTicked && (
        <button
          type="button"
          onClick={tickOnboardingTeam}
          className="-mt-2 inline-flex items-center gap-1.5 justify-self-start rounded-sm text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Users className="size-4" aria-hidden="true" /> Tick the onboarding team ({namesOf(record.assignedTo)})
        </button>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={day ? "Search people" : "Search teammates"}
          aria-label={day ? "Search people" : "Search teammates"}
          className="pl-9"
          autoFocus
        />
      </div>

      <ul className="max-h-52 divide-y overflow-y-auto rounded-lg border" aria-label={day ? "People" : "Teammates"}>
        {isPending &&
          [0, 1, 2].map((row) => (
            <li key={row} className="flex items-center gap-3 p-3">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </li>
          ))}
        {!isPending && people.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">{day ? "No one matches." : "No teammate matches."}</li>}
        {people.map((row) => (
          <li key={row.key}>
            <label className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-muted/50 has-checked:bg-secondary/60">
              <input type="checkbox" checked={chosen.has(row.email)} onChange={() => toggle(row)} className="size-4 shrink-0 accent-primary" />
              {/* Someone outside the team has no account: an "@" in grey, like in the details. */}
              <Avatar name={row.outside ? "@" : row.name} className={cn(row.outside && "bg-muted text-muted-foreground")} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {row.name}
                  {row.onTeam && (
                    <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold tracking-wide text-primary uppercase">Team</span>
                  )}
                  {!row.outside && !row.isActive && <span className="ml-2 text-xs font-normal text-muted-foreground">Deactivated</span>}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {row.email} · {row.outside ? "Outside the team" : ROLES[row.role].label}
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
        <Button type="button" variant="outline" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" onClick={save} disabled={saving}>
          {saving && <LoaderCircle className="animate-spin" />}
          {pick ? "Done" : "Save"}
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

const namesOf = (people) => people.map((person) => person.name).join(", ");

// The chosen people as one comparable string ("a@x.com:|b@y.com:Rafi"), to tell whether anything changed.
const signature = (entries) =>
  [...entries]
    .map(([email, name]) => `${email}:${name}`)
    .sort()
    .join("|");

"use client";

// Small pieces used on many pages:
//   Page layout   PageHeader, EmptyState, PageSkeleton, ServerUnreachable
//   Labels        StatusBadge, TypeIcon, TypeBadge, Avatar
//   Lists         Select, Pagination, PAGE_SIZES
//   Forms         FormField, fieldProps, showServerErrors, PasswordInput, passwordRules
//   Dialogs       ConfirmDialog

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, LoaderCircle, Pill, Stethoscope, WifiOff } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUSES, TYPES } from "@/lib/constants";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Page layout
// ---------------------------------------------------------------------------

// The title row at the top of a page, with an optional "← back" link and buttons.
// With a back link (a form's page, new or edit), the whole header stays fixed at the top of the screen
// while the page scrolls (under the top bar on phones), so the way back and the buttons are always
// at hand. The strip has the page background and reaches the page's edges, so content scrolling under
// it doesn't show through. Put it straight inside the page's container for that to work.
export function PageHeader({ title, description, actions, back }) {
  const titleRow = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
  if (!back) return titleRow;

  return (
    <div className="sticky top-14 z-20 -mx-4 -mt-6 space-y-3 bg-canvas/90 px-4 pt-6 pb-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8">
      <Link
        href={back.href}
        className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> {back.label}
      </Link>
      {titleRow}
    </div>
  );
}

// What to show when there is nothing yet, with a pointer to the next step.
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-12 text-center", className)}>
      {Icon && (
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      {description && <p className="mt-1.5 max-w-md text-sm text-balance text-muted-foreground">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

// Grey placeholder shapes while a page loads.
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

// When the API can't be used (see components/layout/Protected.jsx). `reason` is what the API said, for
// example that it can't reach its database and how to fix that. The page tries again by itself
// every 10 seconds, so it recovers on its own as soon as the problem is fixed.
export function ServerUnreachable({ reason }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(timer);
  }, [router]);

  const tryingAgain = "This page tries again every 10 seconds.";
  let title = "We can't reach the server right now";
  let description = `Please check your internet connection. ${tryingAgain}`;
  if (reason) {
    title = "The server can't reach its database";
    description = `${reason} ${tryingAgain}`;
  } else if (process.env.NODE_ENV === "development") {
    description = `The API isn't answering. Is it running? Check the terminal where you ran npm run dev. ${tryingAgain}`;
  }

  return (
    <EmptyState
      icon={WifiOff}
      title={title}
      description={description}
      action={<Button onClick={() => router.refresh()}>Try again now</Button>}
    />
  );
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

// "● Setup" in the status color. In Implementation it also shows the steps done: "● Implementation · 2/4".
// `steps` is { done, total } or null.
export function StatusBadge({ status, steps, className }) {
  const { label, badge, dot } = STATUSES[status] ?? STATUSES.ongoing;
  const showSteps = status === "implementation" && steps?.total > 0;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", badge, className)}>
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden="true" />
      {label}
      {showSteps && (
        <>
          <span className="font-medium tabular-nums" aria-hidden="true">
            · {steps.done}/{steps.total}
          </span>
          <span className="sr-only">
            , {steps.done} of {steps.total} steps done
          </span>
        </>
      )}
    </span>
  );
}

// A stethoscope for doctors, a pill for pharmacies.
export function TypeIcon({ type, className }) {
  const Icon = type === "doctor" ? Stethoscope : Pill;
  return <Icon className={cn("size-4", className)} aria-hidden="true" />;
}

export function TypeBadge({ type }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <TypeIcon type={type} className="size-3.5" />
      {TYPES[type].label}
    </span>
  );
}

// Soft background + dark text pairs. The same name always gets the same color.
const AVATAR_COLORS = [
  "bg-[#e8ebf7] text-[#1e2a5e]",
  "bg-[#e6f0fd] text-[#1d4fc4]",
  "bg-[#e3f5ef] text-[#0b7553]",
  "bg-[#fdf1dc] text-[#995a06]",
  "bg-[#fbe9ee] text-[#a8304f]",
  "bg-[#efe9fb] text-[#5b3bb0]",
];

function avatarColor(name = "") {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// The person's initials in a colored circle.
export function Avatar({ name, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[0.8rem] font-semibold select-none", avatarColor(name), className)}
    >
      {initials(name)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

// A drop-down list styled like Input. It's the browser's own <select>, so it works the same on phones.
// `active` tints it, to show that it is narrowing the list; `compact` is the short one for toolbars.
export function Select({ className, active = false, compact = false, children, ...props }) {
  return (
    <span className={cn("relative block", className)}>
      <select
        className={cn(
          "h-10 w-full min-w-0 appearance-none rounded-lg border border-input bg-background pr-8 pl-3 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          compact && "h-8 text-sm",
          active && "border-primary/40 bg-primary/5 font-medium text-primary",
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className={cn("pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2", active ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
    </span>
  );
}

// How many rows a page of a list can have. The first one is the smallest.
export const PAGE_SIZES = [10, 20, 50];

// The bar at the bottom of a list: which rows are on screen, how many a page has, and the page numbers.
// `meta` is what the API says about the pages: { page, limit, total, pages }. It is always there,
// even for a list that fits on one page, so the list looks the same whatever its size. It sticks to
// the bottom of the screen while a long list scrolls; the list's card must not have overflow-hidden
// (use overflow-clip), or the bar can't stick.
export function Pagination({ meta, onPage, onLimit }) {
  if (!meta || meta.total === 0) return null;
  const { page, limit, total, pages } = meta;
  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav aria-label="Pages" className="sticky bottom-0 z-10 flex flex-col gap-3 border-t bg-card px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground tabular-nums">
        Showing{" "}
        <span className="font-medium text-foreground">
          {first}–{last}
        </span>{" "}
        of <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="flex items-center gap-2 text-muted-foreground">
          Per page
          <Select compact value={limit} onChange={(event) => onLimit(Number(event.target.value))} aria-label="Rows per page" className="w-18">
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            <ChevronLeft />
          </Button>
          {pageNumbers(page, pages).map((item, index) =>
            item === "…" ? (
              <span key={`gap-${index}`} className="w-6 text-center text-muted-foreground" aria-hidden="true">
                …
              </span>
            ) : (
              <Button
                key={item}
                variant={item === page ? "default" : "ghost"}
                size="icon-sm"
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className="tabular-nums"
                onClick={() => onPage(item)}
              >
                {item}
              </Button>
            ),
          )}
          <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </nav>
  );
}

// The page numbers to show, at most seven: 1 … 8 9 10 … 20. All of them when there are seven or fewer.
function pageNumbers(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "…", pages];
  if (page >= pages - 3) return [1, "…", pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, "…", page - 1, page, page + 1, "…", pages];
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

// Accessibility props for an input that has a FormField message:
//   <Input {...fieldProps("email", errors.email)} {...register("email")} />
export const fieldProps = (id, error) => ({
  id,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-message` : undefined,
});

// A label, the input (children), and under it either the error or a hint.
export function FormField({ id, label, hint, error, className, children }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-message`} className="text-sm text-destructive">
          {error.message}
        </p>
      ) : (
        hint && <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

// Shows the API's field messages next to the matching inputs.
// Returns true if at least one field message was shown.
export function showServerErrors(error, setError) {
  const entries = Object.entries(error?.fields ?? {});
  entries.forEach(([field, message], index) => {
    setError(field, { type: "server", message }, { shouldFocus: index === 0 });
  });
  return entries.length > 0;
}

// A password box with a show / hide button.
export function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-11", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

// The password rule for react-hook-form, the same as the API's: any password is fine,
// it just can't be empty. (72 characters is the most a password can use.)
export const passwordRules = {
  required: "Please choose a password.",
  maxLength: { value: 72, message: "Use 72 characters or fewer." },
};

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

// "Are you sure?" It stays open while the action runs, so the person sees it finish.
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", destructive = false, pending = false, onConfirm }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button onClick={onConfirm} disabled={pending} className={cn(destructive && "bg-destructive text-white hover:bg-destructive/90")}>
            {pending && <LoaderCircle className="animate-spin" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

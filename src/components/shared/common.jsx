"use client";

// Small pieces used on many pages:
//   Page layout   PageHeader, EmptyState, PageSkeleton, ServerUnreachable
//   Labels        StatusBadge, TypeIcon, TypeBadge, Avatar
//   Forms         FormField, fieldProps, showServerErrors, PasswordInput, passwordRules
//   Dialogs       ConfirmDialog

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, Pill, Stethoscope, WifiOff } from "lucide-react";

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

// The photo when there is one, otherwise the person's initials in a colored circle.
// A photo that can't be loaded (for example, one that no longer exists) also shows the initials.
export function Avatar({ name, photoUrl, className }) {
  const [failedUrl, setFailedUrl] = useState(null);
  if (photoUrl && photoUrl !== failedUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- small private photos served by our own API
    return <img src={photoUrl} alt="" onError={() => setFailedUrl(photoUrl)} className={cn("size-9 shrink-0 rounded-full object-cover", className)} />;
  }
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

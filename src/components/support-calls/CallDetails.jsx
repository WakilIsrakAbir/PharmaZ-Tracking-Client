"use client";

// One support call, at /support-calls/:id: who called and the problem, Resolve / Reopen, Edit and
// Delete, and under it when the call came in, who logged it and when it was resolved.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, CircleCheck, MessageCircle, Pencil, Phone, RotateCcw, SearchX, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Avatar, CallStatusBadge, ConfirmDialog, EmptyState, PageHeader, TypeBadge } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChangeCallStatus, useDeleteSupportCall, useSupportCall } from "@/lib/api";
import { formatDate, formatPhone, relativeDay, timeAgo, whatsappNumber } from "@/lib/format";

export function CallDetails({ id }) {
  const { data: call, isPending, isError } = useSupportCall(id);

  if (isPending) return <DetailsSkeleton />;
  if (isError || !call) {
    return <EmptyState icon={SearchX} title="We couldn't find this call" description="It may have been deleted, or the link is wrong." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader back={{ href: "/support-calls", label: "Call log" }} title={call.callerName} actions={<PageActions call={call} />} />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ProblemCard call={call} />
        <AboutCard call={call} />
      </div>
    </div>
  );
}

// Resolve / Reopen, Edit, Delete. A support person only ever sees their own calls here, so every
// button is theirs to use; an admin can do the same on any call.
function PageActions({ call }) {
  const router = useRouter();
  const changeStatus = useChangeCallStatus();
  const deleteCall = useDeleteSupportCall();
  const [confirming, setConfirming] = useState(false);
  const isOpen = call.status === "open";

  async function toggleStatus() {
    try {
      await changeStatus.mutateAsync({ id: call.id, status: isOpen ? "resolved" : "open" });
      toast.success(isOpen ? `${call.callerName}'s call is resolved.` : `${call.callerName}'s call is open again.`);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function confirmDelete() {
    try {
      await deleteCall.mutateAsync(call.id);
      toast.success(`${call.callerName}'s call was deleted.`);
      router.push("/support-calls");
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <>
      <Button variant={isOpen ? "default" : "outline"} onClick={toggleStatus} disabled={changeStatus.isPending}>
        {isOpen ? <CircleCheck /> : <RotateCcw />}
        {isOpen ? "Mark as resolved" : "Reopen"}
      </Button>
      <Button variant="outline" asChild>
        <Link href={`/support-calls/${call.id}/edit`}>
          <Pencil /> Edit
        </Link>
      </Button>
      <Button variant="outline" onClick={() => setConfirming(true)} aria-label={`Delete ${call.callerName}'s call`} className="text-destructive">
        <Trash2 />
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${call.callerName}'s call?`}
        description="This removes the call from the log for everyone. It can't be undone."
        confirmLabel="Delete"
        destructive
        pending={deleteCall.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}

// Who called, how to reach them, and the problem.
function ProblemCard({ call }) {
  return (
    <section aria-label="The call" className="divide-y overflow-hidden rounded-xl border bg-card">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <Avatar name={call.callerName} className="size-14 rounded-xl text-base" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <TypeBadge type={call.callerType} />
              <CallStatusBadge status={call.status} />
            </div>
            <h2 className="mt-2 text-lg leading-snug font-semibold text-balance">{call.callerName}</h2>
            <p className="text-sm text-muted-foreground tabular-nums">{formatPhone(call.phone)}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:${call.phone}`}>
              <Phone /> Call back
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`https://wa.me/${whatsappNumber(call.phone)}`} target="_blank" rel="noreferrer">
              <MessageCircle /> WhatsApp
            </a>
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Problem</h3>
        <p className="mt-1.5 font-semibold">{call.problemTitle}</p>
        {call.description ? (
          <p className="mt-2 text-sm whitespace-pre-line">{call.description}</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No description was written.</p>
        )}
      </div>
    </section>
  );
}

// When the call came in, who logged it, and when it was resolved.
function AboutCard({ call }) {
  const by = call.createdBy;
  return (
    <section aria-label="About this call" className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <Row icon={CalendarClock} label="Called">
        {relativeDay(call.calledAt, new Date())}, {formatDate(call.calledAt, "d MMM yyyy · h:mm a")}
      </Row>
      <Row icon={UserRound} label="Logged by">
        {by ? (
          <span className="flex items-center gap-2.5">
            <Avatar name={by.name} className="size-8 text-xs" />
            <span className="min-w-0">
              <span className="block truncate">{by.name}</span>
              {by.phone && (
                <a href={`tel:${by.phone}`} className="text-xs font-medium text-primary tabular-nums hover:underline">
                  {formatPhone(by.phone)}
                </a>
              )}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">Unknown</span>
        )}
      </Row>
      {call.resolvedAt && (
        <Row icon={CircleCheck} label="Resolved">
          {formatDate(call.resolvedAt, "d MMM yyyy · h:mm a")} <span className="font-normal text-muted-foreground">({timeAgo(call.resolvedAt)})</span>
        </Row>
      )}
      <p className="border-t pt-3 text-xs text-muted-foreground">Last changed {timeAgo(call.updatedAt)}.</p>
    </section>
  );
}

// An icon, a small grey label, and the value under it.
function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="font-medium">{children}</div>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

"use client";

// Log a support call, or edit one:
//   /support-calls/new        "Log a call" in the menu
//   /support-calls/:id/edit
// Who called (a doctor or a pharmacy), their name and phone, the problem, when the call came in,
// and whether it is solved. The call is logged under the signed-in person's name and phone (from
// their account), so there is nothing extra to type.

import { use } from "react";
import Link from "next/link";
import { io } from "next/cache";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { LoaderCircle, SearchX } from "lucide-react";
import { toast } from "sonner";

import { useUser } from "@/components/app-shell/useUser";
import { EmptyState, FormField, PageHeader, PageSkeleton, TypeIcon, fieldProps } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveSupportCall, useSupportCall } from "@/lib/api";
import { CALL_STATUSES, TYPES } from "@/lib/constants";
import { dhakaDateTime, formatPhone, toDateInput, toTimeInput } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NewCallForm() {
  return <CallForm />;
}

// Edit a logged call: load it first.
export function EditCallForm({ id }) {
  const { data: call, isPending, isError } = useSupportCall(id);
  if (isPending) return <PageSkeleton />;
  if (isError) return <EmptyState icon={SearchX} title="We couldn't find this call" description="It may have been deleted." />;
  return <CallForm call={call} />;
}

function CallForm({ call }) {
  use(io()); // "now", the default moment of the call, is worked out on every visit
  const router = useRouter();
  const save = useSaveSupportCall();
  const user = useUser();
  const isEditing = Boolean(call);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: startingValues(call) });

  const backHref = isEditing ? `/support-calls/${call.id}` : "/support-calls";
  const loggedBy = isEditing ? call.createdBy : user;
  const latestDay = toDateInput(new Date()); // a call can't have come in later than today

  async function onSubmit(formValues) {
    try {
      const saved = await save.mutateAsync({ id: call?.id, values: toApiValues(formValues) });
      if (isEditing) {
        toast.success("Changes saved.");
        router.push(`/support-calls/${saved.id}`);
        return;
      }
      toast.success(`${saved.callerName}'s call is in the log.`);
      reset(startingValues()); // this page stays alive in the background: start the next call blank
      router.push("/support-calls");
    } catch (error) {
      showApiErrors(error, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        back={{ href: backHref, label: isEditing ? "Back to the call" : "Call log" }}
        title={isEditing ? `Edit: ${call.callerName}` : "Log a call"}
        description={isEditing ? "Change anything below, then save." : "Write down the call while it is fresh. Fields with * are required."}
      />

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b-[3px] border-primary px-5 py-4 sm:px-6">
          <h2 className="text-xl font-bold tracking-tight text-primary">Support call</h2>
          {loggedBy && (
            <p className="text-sm text-muted-foreground">
              Logged by: <span className="font-medium text-foreground">{loggedBy.name}</span>
              {loggedBy.phone && <span className="tabular-nums"> · {formatPhone(loggedBy.phone)}</span>}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
          {/* Who called: a doctor or a pharmacy, as two tiles. */}
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="text-sm font-medium">
              Who called <span className="text-destructive">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPES).map(([type, { label }]) => (
                <label key={type} className={tileClass}>
                  <input type="radio" value={type} className="size-4 accent-primary" {...register("callerType")} />
                  <TypeIcon type={type} className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <FormField id="callerName" label={<Required>Name</Required>} error={errors.callerName}>
            <Input placeholder="e.g. Rahman Pharmacy, or Dr. Tanvir Ahmed" autoFocus {...fieldProps("callerName", errors.callerName)} {...register("callerName", { required: "Please enter the name of who called." })} />
          </FormField>
          <FormField id="phone" label={<Required>Phone</Required>} error={errors.phone} hint="e.g. 01711-234567">
            <Input type="tel" inputMode="tel" placeholder="01711-234567" {...fieldProps("phone", errors.phone)} {...register("phone", { required: "Please enter their phone number." })} />
          </FormField>

          <FormField id="problemTitle" label={<Required>Problem</Required>} error={errors.problemTitle} hint="In a few words, e.g. App not opening" className="sm:col-span-2">
            <Input placeholder="What is the problem?" {...fieldProps("problemTitle", errors.problemTitle)} {...register("problemTitle", { required: "Please describe the problem in a few words." })} />
          </FormField>
          <FormField id="description" label="Description" error={errors.description} hint="What they said, what you checked, what was agreed." className="sm:col-span-2">
            <Textarea id="description" rows={4} {...register("description")} />
          </FormField>

          {/* When the call came in: now, unless it is logged later. */}
          <FormField id="calledDay" label={<Required>Call date</Required>} error={errors.calledDay}>
            <Input id="calledDay" type="date" max={latestDay} {...register("calledDay", { required: "Please pick the day of the call." })} />
          </FormField>
          <FormField id="calledTime" label={<Required>Time</Required>} error={errors.calledTime}>
            <Input id="calledTime" type="time" {...register("calledTime", { required: "Please pick the time of the call." })} />
          </FormField>

          {/* Open until the problem is solved. */}
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="text-sm font-medium">Status</legend>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CALL_STATUSES).map(([status, { label, dot }]) => (
                <label key={status} className={tileClass}>
                  <input type="radio" value={status} className="size-4 accent-primary" {...register("status")} />
                  <span className={cn("size-2 rounded-full", dot)} aria-hidden="true" />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      {/* On phones the buttons stay at the bottom of the screen. */}
      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t bg-canvas/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button variant="outline" size="lg" asChild>
          <Link href={backHref}>Cancel</Link>
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="animate-spin" />}
          {isEditing ? "Save changes" : "Log the call"}
        </Button>
      </div>
    </form>
  );
}

// A choice tile: a radio, an icon or dot, and the name. Tinted while chosen.
const tileClass =
  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-checked:border-primary has-checked:bg-secondary has-focus-visible:ring-3 has-focus-visible:ring-ring/50";

function Required({ children }) {
  return (
    <>
      {children} <span className="text-destructive">*</span>
    </>
  );
}

// ---------------------------------------------------------------------------
// Values: between the form and the API
// ---------------------------------------------------------------------------

// What the form starts with: the saved call when editing, otherwise empty boxes with the call at "now".
function startingValues(call) {
  const now = new Date();
  return {
    callerType: call?.callerType ?? "pharmacy",
    callerName: call?.callerName ?? "",
    phone: call ? formatPhone(call.phone) : "",
    problemTitle: call?.problemTitle ?? "",
    description: call?.description ?? "",
    calledDay: toDateInput(call ? call.calledAt : now),
    calledTime: toTimeInput(call ? call.calledAt : now),
    status: call?.status ?? "open",
  };
}

// The form keeps the call as a day and a time; the API wants one moment (calledAt).
function toApiValues({ calledDay, calledTime, ...fields }) {
  return { ...fields, calledAt: dhakaDateTime(calledDay, calledTime || "00:00") };
}

// Puts the API's messages next to the right boxes. The API calls the moment "calledAt";
// the form shows it as the "calledDay" box. Anything else becomes a toast.
function showApiErrors(error, setError) {
  const fields = Object.entries(error.fields ?? {});
  fields.forEach(([field, message], index) => {
    const formField = field === "calledAt" ? "calledDay" : field;
    setError(formField, { type: "server", message }, { shouldFocus: index === 0 });
  });
  if (fields.length === 0) toast.error(error.message);
}

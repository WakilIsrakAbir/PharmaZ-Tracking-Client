"use client";

// The doctor and pharmacy onboarding forms, used for both new and edit:
//   /doctors/new, /pharmacies/new           (?date=2026-10-21 pre-fills the visit date)
//   /doctors/:id/edit, /pharmacies/:id/edit
// The top part looks like the paper form (numbered fields); under it the visit date,
// time and status decide where the form shows on the dashboard calendar.
//
// To add a field: add it to the model on the server (server/src/models), add its
// number and label to FIELDS in lib/constants.js, then add it to DoctorFields or
// PharmacyFields in FormFields.jsx.

import { use, useState } from "react";
import Link from "next/link";
import { io } from "next/cache";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { LoaderCircle, SearchX } from "lucide-react";
import { toast } from "sonner";

import { useUser } from "@/components/app-shell/useUser";
import { DoctorFields, PharmacyFields, PhotoPicker, RequiredLabel, StatusChoice } from "@/components/record-form/FormFields";
import { EmptyState, FormField, PageHeader, PageSkeleton } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRecord, useSaveRecord } from "@/lib/api";
import { FIELDS, TYPES } from "@/lib/constants";
import { dashboardLink, dayKey, dhakaDateTime, emailSummary, formatDate, formatPhone, toDateInput, toTimeInput } from "@/lib/format";

// ---------------------------------------------------------------------------
// The two pages
// ---------------------------------------------------------------------------

// New form. Next.js keeps visited pages alive in the background,
// so a different ?date= gets a fresh form (the `key`).
export function NewRecordForm({ type }) {
  const date = useSearchParams().get("date") ?? "";
  return <RecordForm key={date} type={type} visitDay={date} />;
}

// Edit a submitted form: load it first.
export function EditRecordForm({ type, id }) {
  const { data: record, isPending, isError } = useRecord(type, id);
  if (isPending) return <PageSkeleton />;
  if (isError) return <EmptyState icon={SearchX} title="We couldn't find this form" description="It may have been deleted." />;
  return <RecordForm type={type} record={record} />;
}

// ---------------------------------------------------------------------------
// The form
// ---------------------------------------------------------------------------
function RecordForm({ type, record, visitDay }) {
  use(io()); // the default visit date is "today", worked out on every visit
  const router = useRouter();
  const save = useSaveRecord(type);
  const [photo, setPhoto] = useState(null); // { file, url } when a new photo was picked
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: startingValues(type, record, visitDay) });

  const { path, formTitle, label } = TYPES[type];
  const isEditing = Boolean(record);
  const backHref = isEditing ? `${path}/${record.id}` : path;
  // The form is saved under this person's name and phone (from their account), so there's nothing to type.
  const signedInUser = useUser();
  const marketingPerson = isEditing ? record.createdBy : signedInUser;

  async function onSubmit(formValues) {
    const values = toApiValues(type, formValues);
    try {
      const { data: saved, meta } = await save.mutateAsync({ id: record?.id, values, photo: photo?.file });
      if (isEditing) {
        // Everyone assigned to the form gets the new version by email.
        toast.success(emailSummary("Changes saved.", meta?.email));
        router.push(`${path}/${saved.id}`);
        return;
      }
      toast.success(`${saved.name} is on the calendar for ${formatDate(saved.visitDate, "EEE d MMM, h:mm a")}.`);
      // This page stays alive in the background; empty it so the next new form starts blank.
      reset(startingValues(type));
      setPhoto(null);
      router.push(dashboardLink(saved));
    } catch (error) {
      showApiErrors(error, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        back={{ href: backHref, label: isEditing ? "Back to the form" : TYPES[type].plural }}
        title={isEditing ? `Edit: ${record.name}` : `New ${label.toLowerCase()} form`}
        description={isEditing ? "Change anything below, then save." : "Fill this in during or after your visit. Fields with * are required."}
      />

      {/* Part 1: looks like the paper form, a title over a navy line, then the numbered fields. */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b-[3px] border-primary px-5 py-4 sm:px-6">
          <h2 className="text-xl font-bold tracking-tight text-primary">{formTitle}</h2>
          {marketingPerson && (
            <p className="text-sm text-muted-foreground">
              Marketing person: <span className="font-medium text-foreground">{marketingPerson.name}</span>
              {marketingPerson.phone && <span className="tabular-nums"> · {formatPhone(marketingPerson.phone)}</span>}
            </p>
          )}
        </div>
        <div className="space-y-7 p-5 sm:p-6">
          <PhotoPicker field={FIELDS[type].photo} current={record?.photoUrl} photo={photo} onChange={setPhoto} error={errors.photo} />
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
            {type === "doctor" ? <DoctorFields register={register} errors={errors} /> : <PharmacyFields register={register} errors={errors} />}
          </div>
        </div>
      </section>

      {/* Part 2: when the visit is and how far along it is. This is what the calendar shows. */}
      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="font-semibold">Visit and status</h2>
        <p className="mt-1 text-sm text-muted-foreground">This is what shows on the calendar.</p>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField id="visitDay" label={<RequiredLabel>Visit date</RequiredLabel>} error={errors.visitDay}>
            <Input id="visitDay" type="date" {...register("visitDay", { required: "Please pick the visit date." })} />
          </FormField>
          <FormField id="visitTime" label={<RequiredLabel>Time</RequiredLabel>} error={errors.visitTime}>
            <Input id="visitTime" type="time" {...register("visitTime", { required: "Please pick the time." })} />
          </FormField>
          <StatusChoice register={register} />
          <FormField id="notes" label="Notes" hint="Anything the team should know, e.g. what was agreed." className="sm:col-span-2">
            <Textarea id="notes" rows={3} {...register("notes")} />
          </FormField>
        </div>
      </section>

      {/* On phones the buttons stay at the bottom of the screen. */}
      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t bg-canvas/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button variant="outline" size="lg" asChild>
          <Link href={backHref}>Cancel</Link>
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="animate-spin" />}
          {isEditing ? "Save changes" : "Submit form"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Values: between the form and the API
// ---------------------------------------------------------------------------

// What the form starts with: the saved record when editing, otherwise empty boxes,
// with the visit on `visitDay` (from ?date=) or today, at 10:00.
function startingValues(type, record, visitDay) {
  const text = (key) => record?.[key] ?? "";

  let visitDate = dayKey(new Date());
  if (/^\d{4}-\d{2}-\d{2}$/.test(visitDay ?? "")) visitDate = visitDay;
  if (record) visitDate = toDateInput(record.visitDate);

  const shared = {
    name: text("name"),
    phone: record ? formatPhone(record.phone) : "",
    email: text("email"),
    address: text("address"),
    availableDays: record?.availableDays ?? [],
    availableFrom: text("availableFrom"),
    availableTo: text("availableTo"),
    visitDay: visitDate,
    visitTime: record ? toTimeInput(record.visitDate) : "10:00",
    status: record?.status ?? "ongoing",
    notes: text("notes"),
  };

  if (type === "doctor") {
    const fee = (key) => record?.fees?.[key] ?? "";
    return {
      ...shared,
      bmdcRegNo: text("bmdcRegNo"),
      chamberName: text("chamberName"),
      consultationTypes: record?.consultationTypes ?? [],
      chamberNo: text("chamberNo"),
      slotDuration: record?.slotDuration ? String(record.slotDuration) : "",
      fees: { firstVisit: fee("firstVisit"), reportView: fee("reportView"), secondVisit: fee("secondVisit"), afterOneMonth: fee("afterOneMonth") },
    };
  }

  return {
    ...shared,
    ownerName: text("ownerName"),
    drugLicenseNo: text("drugLicenseNo"),
    tradeLicenseNo: text("tradeLicenseNo"),
    area: text("area"),
    district: text("district"),
    homeDelivery: yesNoFromBoolean(record?.homeDelivery),
    paymentMethods: record?.paymentMethods ?? [],
  };
}

// The form keeps the visit as a day and a time; the API wants one moment (visitDate).
function toApiValues(type, { visitDay, visitTime, homeDelivery, ...fields }) {
  const values = { ...fields, visitDate: dhakaDateTime(visitDay, visitTime) };
  if (type === "pharmacy") values.homeDelivery = booleanFromYesNo(homeDelivery);
  return values;
}

function yesNoFromBoolean(value) {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
}

function booleanFromYesNo(value) {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

// Puts the API's messages next to the right boxes. The API calls the visit "visitDate";
// the form shows it as the "visitDay" box. Anything else becomes a toast.
function showApiErrors(error, setError) {
  const fields = Object.entries(error.fields ?? {});
  fields.forEach(([field, message], index) => {
    const formField = field === "visitDate" ? "visitDay" : field;
    setError(formField, { type: "server", message }, { shouldFocus: index === 0 });
  });
  if (fields.length === 0) toast.error(error.message);
}

"use client";

// The doctor and pharmacy onboarding forms, used for both new and edit:
//   /doctors/new, /pharmacies/new           (?date=2026-10-21 pre-fills the visit date)
//   /doctors/:id/edit, /pharmacies/:id/edit
// The top part looks like the paper form (numbered fields); under it the visit date,
// time and status decide where the form shows on the dashboard calendar.
//
// To add a field: add it to the model on the server (server/src/models), add its
// number and label to FIELDS in lib/constants.js, then add it to DoctorFields or
// PharmacyFields below.

import { use, useState } from "react";
import Link from "next/link";
import { io } from "next/cache";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Camera, LoaderCircle, SearchX } from "lucide-react";
import { toast } from "sonner";

import { useUser } from "@/components/AppShell";
import { EmptyState, FormField, PageHeader, PageSkeleton } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRecord, useSaveRecord } from "@/lib/api";
import { CONSULTATION_TYPES, DAYS, FIELDS, PAYMENT_METHODS, SLOT_DURATIONS, STATUSES, TYPES } from "@/lib/constants";
import { dashboardLink, dayKey, dhakaDateTime, formatDate, formatPhone, toDateInput, toTimeInput } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // the API refuses bigger photos too

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
      const saved = await save.mutateAsync({ id: record?.id, values, photo: photo?.file });
      if (isEditing) {
        toast.success("Changes saved.");
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
// The fields of each form, in paper-form order
// ---------------------------------------------------------------------------
function DoctorFields({ register, errors }) {
  const f = FIELDS.doctor;
  return (
    <>
      <NumberedField field={f.name} id="name" required wide error={errors.name}>
        <Input id="name" placeholder="e.g. Dr. Tanvir Ahmed (Cardiology)" {...register("name", { required: "Please enter the doctor's full name." })} />
      </NumberedField>
      <NumberedField field={f.bmdcRegNo} id="bmdcRegNo" error={errors.bmdcRegNo}>
        <Input id="bmdcRegNo" placeholder="e.g. A-43921" {...register("bmdcRegNo")} />
      </NumberedField>
      <NumberedField field={f.phone} id="phone" required error={errors.phone}>
        <Input id="phone" type="tel" inputMode="tel" placeholder="01711-234567" {...register("phone", { required: "Please enter a phone number." })} />
      </NumberedField>
      <NumberedField field={f.email} id="email" wide error={errors.email}>
        <Input id="email" type="email" inputMode="email" placeholder="name@example.com" {...register("email")} />
      </NumberedField>
      <NumberedField field={f.chamberName} id="chamberName" wide error={errors.chamberName}>
        <Input id="chamberName" placeholder="e.g. Square Hospital Chambers" {...register("chamberName")} />
      </NumberedField>
      <NumberedField field={f.address} id="address" required wide error={errors.address}>
        <Textarea id="address" rows={2} placeholder="Floor, building, road, area, city" {...register("address", { required: "Please enter the chamber address." })} />
      </NumberedField>
      <NumberedField field={f.consultationTypes} group error={errors.consultationTypes}>
        <ChoiceChips name="consultationTypes" options={CONSULTATION_TYPES} register={register} />
      </NumberedField>
      <NumberedField field={f.chamberNo} id="chamberNo" error={errors.chamberNo}>
        <Input id="chamberNo" placeholder="e.g. Room 402" {...register("chamberNo")} />
      </NumberedField>
      <NumberedField field={f.slotDuration} id="slotDuration" error={errors.slotDuration}>
        <select id="slotDuration" className={SELECT_CLASSES} {...register("slotDuration")}>
          <option value="">Choose…</option>
          {SLOT_DURATIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} mins
            </option>
          ))}
        </select>
      </NumberedField>
      <NumberedField field={f.available} group wide error={errors.availableDays || errors.availableFrom || errors.availableTo}>
        <DaysAndHours register={register} />
      </NumberedField>
      <NumberedField field={f.firstVisit} id="fees.firstVisit" error={errors.fees?.firstVisit}>
        <TakaInput id="fees.firstVisit" {...register("fees.firstVisit")} />
      </NumberedField>
      <NumberedField field={f.reportView} id="fees.reportView" error={errors.fees?.reportView}>
        <TakaInput id="fees.reportView" {...register("fees.reportView")} />
      </NumberedField>
      <NumberedField field={f.secondVisit} id="fees.secondVisit" error={errors.fees?.secondVisit}>
        <TakaInput id="fees.secondVisit" {...register("fees.secondVisit")} />
      </NumberedField>
      <NumberedField field={f.afterOneMonth} id="fees.afterOneMonth" error={errors.fees?.afterOneMonth}>
        <TakaInput id="fees.afterOneMonth" {...register("fees.afterOneMonth")} />
      </NumberedField>
    </>
  );
}

function PharmacyFields({ register, errors }) {
  const f = FIELDS.pharmacy;
  return (
    <>
      <NumberedField field={f.name} id="name" required wide error={errors.name}>
        <Input id="name" placeholder="e.g. Rahman Pharmacy" {...register("name", { required: "Please enter the pharmacy name." })} />
      </NumberedField>
      <NumberedField field={f.ownerName} id="ownerName" error={errors.ownerName}>
        <Input id="ownerName" placeholder="e.g. Abdur Rahman" {...register("ownerName")} />
      </NumberedField>
      <NumberedField field={f.phone} id="phone" required error={errors.phone}>
        <Input id="phone" type="tel" inputMode="tel" placeholder="01811-223344" {...register("phone", { required: "Please enter a phone number." })} />
      </NumberedField>
      <NumberedField field={f.email} id="email" wide error={errors.email}>
        <Input id="email" type="email" inputMode="email" placeholder="name@example.com" {...register("email")} />
      </NumberedField>
      <NumberedField field={f.drugLicenseNo} id="drugLicenseNo" error={errors.drugLicenseNo}>
        <Input id="drugLicenseNo" placeholder="DGDA licence number" {...register("drugLicenseNo")} />
      </NumberedField>
      <NumberedField field={f.tradeLicenseNo} id="tradeLicenseNo" error={errors.tradeLicenseNo}>
        <Input id="tradeLicenseNo" {...register("tradeLicenseNo")} />
      </NumberedField>
      <NumberedField field={f.address} id="address" required wide error={errors.address}>
        <Textarea id="address" rows={2} placeholder="House, road, area, city" {...register("address", { required: "Please enter the pharmacy address." })} />
      </NumberedField>
      <NumberedField field={f.area} id="area" error={errors.area}>
        <Input id="area" placeholder="e.g. Dhanmondi" {...register("area")} />
      </NumberedField>
      <NumberedField field={f.district} id="district" error={errors.district}>
        <Input id="district" placeholder="e.g. Dhaka" {...register("district")} />
      </NumberedField>
      <NumberedField field={f.available} group wide error={errors.availableDays || errors.availableFrom || errors.availableTo}>
        <DaysAndHours register={register} />
      </NumberedField>
      <NumberedField field={f.homeDelivery} group error={errors.homeDelivery}>
        <ChoiceChips name="homeDelivery" type="radio" options={YES_NO} register={register} />
      </NumberedField>
      <NumberedField field={f.paymentMethods} group error={errors.paymentMethods}>
        <ChoiceChips name="paymentMethods" options={PAYMENT_METHODS} register={register} />
      </NumberedField>
    </>
  );
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------
const SELECT_CLASSES =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function RequiredLabel({ children }) {
  return (
    <>
      {children} <span className="text-destructive">*</span>
    </>
  );
}

// The navy number circle from the paper form.
function NumberCircle({ no }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
      {no}
    </span>
  );
}

// A paper-form field: the number, the label, the input, and the error under it.
// `group` is for a set of choices, so it uses fieldset + legend instead of a label.
function NumberedField({ field: [no, label], id, required, wide, group, error, children }) {
  const Wrapper = group ? "fieldset" : "div";
  const Caption = group ? "legend" : "label";
  return (
    <Wrapper className={cn("space-y-2", wide && "md:col-span-2")}>
      <Caption {...(!group && { htmlFor: id })} className="mb-2 flex items-center gap-2 text-sm font-medium">
        <NumberCircle no={no} />
        {label}
        {required && <span className="text-destructive">*</span>}
      </Caption>
      {children}
      {error?.message && <p className="text-sm text-destructive">{error.message}</p>}
    </Wrapper>
  );
}

// Tick boxes (or radio buttons) shown as chips.
function ChoiceChips({ name, options, register, type = "checkbox" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value, label }) => (
        <label
          key={value}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50 has-checked:border-primary has-checked:bg-secondary has-checked:font-medium has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
        >
          <input type={type} value={value} className="size-4 accent-primary" {...register(name)} />
          {label}
        </label>
      ))}
    </div>
  );
}

// Field 11: which days, and from–to hours.
function DaysAndHours({ register }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {DAYS.map(({ value, label }) => (
          <label
            key={value}
            className="cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors select-none hover:bg-muted/50 has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input type="checkbox" value={value} className="sr-only" {...register("availableDays")} />
            {label}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">From</span>
        <Input type="time" aria-label="From" className="w-36" {...register("availableFrom")} />
        <span className="text-muted-foreground">to</span>
        <Input type="time" aria-label="To" className="w-36" {...register("availableTo")} />
      </div>
    </div>
  );
}

// A number box with a ৳ sign in front.
function TakaInput(props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">৳</span>
      <Input type="number" inputMode="numeric" min="0" step="1" placeholder="0" className="pl-7" {...props} />
    </div>
  );
}

// The status, as three big choices.
function StatusChoice({ register }) {
  return (
    <fieldset className="space-y-2 sm:col-span-2">
      <legend className="text-sm font-medium">
        <RequiredLabel>Status</RequiredLabel>
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {Object.entries(STATUSES).map(([value, status]) => (
          <label
            key={value}
            className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-checked:border-primary has-checked:bg-secondary has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input type="radio" value={value} className="mt-1 size-4 accent-primary" {...register("status")} />
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className={cn("size-2 rounded-full", status.dot)} />
                {status.label}
              </span>
              <span className="block text-xs text-muted-foreground">{status.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// Field 2: tap the box to take a photo (on phones) or choose a file.
function PhotoPicker({ field: [no, label], current, photo, onChange, error }) {
  const preview = photo?.url ?? current;

  function choose(file) {
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("That photo is bigger than 2 MB. Please choose a smaller one.");
      return;
    }
    if (photo?.url) URL.revokeObjectURL(photo.url); // free the old preview
    onChange({ file, url: URL.createObjectURL(file) });
  }

  function clear() {
    if (photo?.url) URL.revokeObjectURL(photo.url);
    onChange(null);
  }

  return (
    <div className="flex items-center gap-5">
      <label className="relative flex size-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-input bg-muted/40 text-center text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local preview, or a private photo from our own API
          <img src={preview} alt="Chosen photo" className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 px-2">
            <Camera className="size-5" aria-hidden="true" />
            Attach photo
          </span>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label={label}
          onChange={(event) => {
            choose(event.target.files?.[0]);
            event.target.value = ""; // lets the same file be picked again
          }}
        />
      </label>
      <div className="min-w-0 space-y-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <NumberCircle no={no} /> {label}
        </p>
        <p className="text-sm text-muted-foreground">JPG, PNG or WEBP, up to 2 MB. On a phone you can take the photo now.</p>
        {photo && (
          <Button type="button" variant="ghost" size="sm" onClick={clear} className="-ml-3">
            Remove new photo
          </Button>
        )}
        {error?.message && <p className="text-sm text-destructive">{error.message}</p>}
      </div>
    </div>
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

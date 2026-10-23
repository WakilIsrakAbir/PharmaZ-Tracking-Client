import { ChoiceChips } from "@/components/record-form/ChoiceChips";
import { DaysAndHours } from "@/components/record-form/DaysAndHours";
import { NumberedField } from "@/components/record-form/NumberedField";
import { TakaInput } from "@/components/record-form/TakaInput";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONSULTATION_TYPES, FIELDS, SLOT_DURATIONS } from "@/lib/constants";

const SELECT_CLASSES =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

// The fields of the doctor form, in paper-form order.
export function DoctorFields({ register, errors }) {
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

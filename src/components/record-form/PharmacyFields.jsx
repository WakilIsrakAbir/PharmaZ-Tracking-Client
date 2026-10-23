import { ChoiceChips } from "@/components/record-form/ChoiceChips";
import { DaysAndHours } from "@/components/record-form/DaysAndHours";
import { NumberedField } from "@/components/record-form/NumberedField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FIELDS, PAYMENT_METHODS } from "@/lib/constants";

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

// The fields of the pharmacy form, in paper-form order.
export function PharmacyFields({ register, errors }) {
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

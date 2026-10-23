import { toast } from "sonner";

import { dayKey, dhakaDateTime, formatPhone, toDateInput, toTimeInput } from "@/lib/format";

// Values: between the form and the API.

// What the form starts with: the saved record when editing, otherwise empty boxes,
// with the visit on `visitDay` (from ?date=) or today, at 10:00.
export function startingValues(type, record, visitDay) {
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
export function toApiValues(type, { visitDay, visitTime, homeDelivery, ...fields }) {
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
export function showApiErrors(error, setError) {
  const fields = Object.entries(error.fields ?? {});
  fields.forEach(([field, message], index) => {
    const formField = field === "visitDate" ? "visitDay" : field;
    setError(formField, { type: "server", message }, { shouldFocus: index === 0 });
  });
  if (fields.length === 0) toast.error(error.message);
}

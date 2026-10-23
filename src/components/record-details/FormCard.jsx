import { Card } from "@/components/record-details/Card";
import { CONSULTATION_TYPES, FIELDS, PAYMENT_METHODS, TYPES } from "@/lib/constants";
import { formatAvailability, formatPhone, formatTaka } from "@/lib/format";

// Full page only: every numbered field, as on the paper form.
export function FormCard({ record }) {
  const rows = record.type === "doctor" ? doctorRows(record) : pharmacyRows(record);
  return (
    <Card title={TYPES[record.type].formTitle}>
      <dl className="divide-y">
        {rows.map(([no, label, value]) => (
          <div key={no} className="flex gap-3 py-2.5">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {no}
            </span>
            <dt className="w-32 shrink-0 text-sm text-muted-foreground sm:w-40">{label}</dt>
            <dd className="min-w-0 flex-1 text-sm font-medium wrap-break-word">
              {value || <span className="font-normal text-muted-foreground/70">Not given</span>}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

// The rows of each form: [number, label, value shown]
const labelOf = (options, value) => options.find((option) => option.value === value)?.label ?? value;
const row = ([no, label], value) => [no, label, value];

function yesOrNo(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "";
}

function doctorRows(record) {
  const f = FIELDS.doctor;
  return [
    row(f.name, record.name),
    row(f.photo, record.photoUrl ? "Attached" : ""),
    row(f.bmdcRegNo, record.bmdcRegNo),
    row(f.phone, formatPhone(record.phone)),
    row(f.email, record.email),
    row(f.chamberName, record.chamberName),
    row(f.address, record.address),
    row(f.consultationTypes, record.consultationTypes.map((value) => labelOf(CONSULTATION_TYPES, value)).join(", ")),
    row(f.chamberNo, record.chamberNo),
    row(f.slotDuration, record.slotDuration ? `${record.slotDuration} mins` : ""),
    row(f.available, formatAvailability(record)),
    row(f.firstVisit, formatTaka(record.fees?.firstVisit)),
    row(f.reportView, formatTaka(record.fees?.reportView)),
    row(f.secondVisit, formatTaka(record.fees?.secondVisit)),
    row(f.afterOneMonth, formatTaka(record.fees?.afterOneMonth)),
  ];
}

function pharmacyRows(record) {
  const f = FIELDS.pharmacy;
  return [
    row(f.name, record.name),
    row(f.photo, record.photoUrl ? "Attached" : ""),
    row(f.ownerName, record.ownerName),
    row(f.phone, formatPhone(record.phone)),
    row(f.email, record.email),
    row(f.drugLicenseNo, record.drugLicenseNo),
    row(f.tradeLicenseNo, record.tradeLicenseNo),
    row(f.address, record.address),
    row(f.area, record.area),
    row(f.district, record.district),
    row(f.available, formatAvailability(record)),
    row(f.homeDelivery, yesOrNo(record.homeDelivery)),
    row(f.paymentMethods, record.paymentMethods.map((value) => labelOf(PAYMENT_METHODS, value)).join(", ")),
  ];
}

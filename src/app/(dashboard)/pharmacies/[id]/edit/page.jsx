import { Protected } from "@/components/layout/Protected";
import { ONBOARDING_ROLES } from "@/lib/constants";
import { EditRecordForm } from "@/components/record-form/RecordForm";

export const metadata = { title: "Edit pharmacy form" };

export default function Page({ params }) {
  return (
    <Protected roles={ONBOARDING_ROLES}>
      <EditPharmacy params={params} />
    </Protected>
  );
}

async function EditPharmacy({ params }) {
  const { id } = await params;
  return <EditRecordForm type="pharmacy" id={id} />;
}

import { Protected } from "@/components/layout/Protected";
import { ONBOARDING_ROLES } from "@/lib/constants";
import { EditRecordForm } from "@/components/record-form/RecordForm";

export const metadata = { title: "Edit doctor form" };

export default function Page({ params }) {
  return (
    <Protected roles={ONBOARDING_ROLES}>
      <EditDoctor params={params} />
    </Protected>
  );
}

async function EditDoctor({ params }) {
  const { id } = await params;
  return <EditRecordForm type="doctor" id={id} />;
}

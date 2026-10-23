import { Protected } from "@/components/layout/Protected";
import { EditRecordForm } from "@/components/record-form/RecordForm";

export const metadata = { title: "Edit pharmacy form" };

export default function Page({ params }) {
  return (
    <Protected>
      <EditPharmacy params={params} />
    </Protected>
  );
}

async function EditPharmacy({ params }) {
  const { id } = await params;
  return <EditRecordForm type="pharmacy" id={id} />;
}

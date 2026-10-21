import { Protected } from "@/components/Protected";
import { EditRecordForm } from "@/components/RecordForm";

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

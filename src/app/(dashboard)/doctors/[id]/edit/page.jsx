import { Protected } from "@/components/Protected";
import { EditRecordForm } from "@/components/RecordForm";

export const metadata = { title: "Edit doctor form" };

export default function Page({ params }) {
  return (
    <Protected>
      <EditDoctor params={params} />
    </Protected>
  );
}

async function EditDoctor({ params }) {
  const { id } = await params;
  return <EditRecordForm type="doctor" id={id} />;
}

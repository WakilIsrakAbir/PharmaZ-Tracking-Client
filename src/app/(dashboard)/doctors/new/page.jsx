import { Protected } from "@/components/layout/Protected";
import { NewRecordForm } from "@/components/record-form/RecordForm";

export const metadata = { title: "New doctor form" };

export default function Page() {
  return (
    <Protected>
      <NewRecordForm type="doctor" />
    </Protected>
  );
}

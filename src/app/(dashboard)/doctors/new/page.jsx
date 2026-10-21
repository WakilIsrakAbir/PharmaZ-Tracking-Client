import { Protected } from "@/components/Protected";
import { NewRecordForm } from "@/components/RecordForm";

export const metadata = { title: "New doctor form" };

export default function Page() {
  return (
    <Protected>
      <NewRecordForm type="doctor" />
    </Protected>
  );
}

import { Protected } from "@/components/Protected";
import { NewRecordForm } from "@/components/RecordForm";

export const metadata = { title: "New pharmacy form" };

export default function Page() {
  return (
    <Protected>
      <NewRecordForm type="pharmacy" />
    </Protected>
  );
}

import { Protected } from "@/components/layout/Protected";
import { RecordList } from "@/components/record-list/RecordList";

export const metadata = { title: "Pharmacies" };

export default function Page() {
  return (
    <Protected>
      <RecordList type="pharmacy" />
    </Protected>
  );
}

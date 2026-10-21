import { Protected } from "@/components/Protected";
import { RecordList } from "@/components/RecordList";

export const metadata = { title: "Pharmacies" };

export default function Page() {
  return (
    <Protected>
      <RecordList type="pharmacy" />
    </Protected>
  );
}

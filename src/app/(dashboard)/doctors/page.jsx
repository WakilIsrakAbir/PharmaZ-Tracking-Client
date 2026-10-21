import { Protected } from "@/components/Protected";
import { RecordList } from "@/components/RecordList";

export const metadata = { title: "Doctors" };

export default function Page() {
  return (
    <Protected>
      <RecordList type="doctor" />
    </Protected>
  );
}

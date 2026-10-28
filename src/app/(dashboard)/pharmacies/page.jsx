import { Protected } from "@/components/layout/Protected";
import { ONBOARDING_ROLES } from "@/lib/constants";
import { RecordList } from "@/components/record-list/RecordList";

export const metadata = { title: "Pharmacies" };

export default function Page() {
  return (
    <Protected roles={ONBOARDING_ROLES}>
      <RecordList type="pharmacy" />
    </Protected>
  );
}

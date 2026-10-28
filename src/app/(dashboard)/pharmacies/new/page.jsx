import { Protected } from "@/components/layout/Protected";
import { ONBOARDING_ROLES } from "@/lib/constants";
import { NewRecordForm } from "@/components/record-form/RecordForm";

export const metadata = { title: "New pharmacy form" };

export default function Page() {
  return (
    <Protected roles={ONBOARDING_ROLES}>
      <NewRecordForm type="pharmacy" />
    </Protected>
  );
}

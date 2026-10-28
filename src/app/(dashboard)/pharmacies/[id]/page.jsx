import { Protected } from "@/components/layout/Protected";
import { ONBOARDING_ROLES } from "@/lib/constants";
import { RecordDetails } from "@/components/record-details/RecordDetails";

export const metadata = { title: "Pharmacy" };

export default function Page({ params }) {
  return (
    <Protected roles={ONBOARDING_ROLES}>
      <Pharmacy params={params} />
    </Protected>
  );
}

async function Pharmacy({ params }) {
  const { id } = await params;
  return <RecordDetails type="pharmacy" id={id} />;
}

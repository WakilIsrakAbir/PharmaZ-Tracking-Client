import { Protected } from "@/components/layout/Protected";
import { ONBOARDING_ROLES } from "@/lib/constants";
import { RecordDetails } from "@/components/record-details/RecordDetails";

export const metadata = { title: "Doctor" };

export default function Page({ params }) {
  return (
    <Protected roles={ONBOARDING_ROLES}>
      <Doctor params={params} />
    </Protected>
  );
}

async function Doctor({ params }) {
  const { id } = await params;
  return <RecordDetails type="doctor" id={id} />;
}

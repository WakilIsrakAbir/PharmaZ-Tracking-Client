import { Protected } from "@/components/Protected";
import { RecordDetails } from "@/components/RecordDetails";

export const metadata = { title: "Pharmacy" };

export default function Page({ params }) {
  return (
    <Protected>
      <Pharmacy params={params} />
    </Protected>
  );
}

async function Pharmacy({ params }) {
  const { id } = await params;
  return <RecordDetails type="pharmacy" id={id} />;
}

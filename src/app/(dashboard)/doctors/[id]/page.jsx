import { Protected } from "@/components/Protected";
import { RecordDetails } from "@/components/RecordDetails";

export const metadata = { title: "Doctor" };

export default function Page({ params }) {
  return (
    <Protected>
      <Doctor params={params} />
    </Protected>
  );
}

async function Doctor({ params }) {
  const { id } = await params;
  return <RecordDetails type="doctor" id={id} />;
}

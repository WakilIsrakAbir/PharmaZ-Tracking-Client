import { Protected } from "@/components/layout/Protected";
import { CallDetails } from "@/components/support-calls/CallDetails";
import { SUPPORT_ROLES } from "@/lib/constants";

export const metadata = { title: "Support call" };

export default function Page({ params }) {
  return (
    <Protected roles={SUPPORT_ROLES}>
      <Call params={params} />
    </Protected>
  );
}

async function Call({ params }) {
  const { id } = await params;
  return <CallDetails id={id} />;
}

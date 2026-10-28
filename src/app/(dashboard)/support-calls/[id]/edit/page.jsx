import { Protected } from "@/components/layout/Protected";
import { EditCallForm } from "@/components/support-calls/CallForm";
import { SUPPORT_ROLES } from "@/lib/constants";

export const metadata = { title: "Edit support call" };

export default function Page({ params }) {
  return (
    <Protected roles={SUPPORT_ROLES}>
      <EditCall params={params} />
    </Protected>
  );
}

async function EditCall({ params }) {
  const { id } = await params;
  return <EditCallForm id={id} />;
}

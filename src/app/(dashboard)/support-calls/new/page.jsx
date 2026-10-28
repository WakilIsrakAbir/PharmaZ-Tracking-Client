import { Protected } from "@/components/layout/Protected";
import { NewCallForm } from "@/components/support-calls/CallForm";
import { SUPPORT_ROLES } from "@/lib/constants";

export const metadata = { title: "Log a call" };

export default function Page() {
  return (
    <Protected roles={SUPPORT_ROLES}>
      <NewCallForm />
    </Protected>
  );
}

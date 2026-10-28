import { Protected } from "@/components/layout/Protected";
import { CallLog } from "@/components/support-calls/CallLog";
import { SUPPORT_ROLES } from "@/lib/constants";

export const metadata = { title: "Call log" };

// The support team's home page. Admins see every call; marketing people are sent to the dashboard.
export default function Page() {
  return (
    <Protected roles={SUPPORT_ROLES}>
      <CallLog />
    </Protected>
  );
}

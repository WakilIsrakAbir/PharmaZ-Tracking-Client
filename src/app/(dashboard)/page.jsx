import { Dashboard } from "@/components/dashboard/Dashboard";
import { Protected } from "@/components/layout/Protected";
import { ONBOARDING_ROLES } from "@/lib/constants";

export const metadata = { title: "Dashboard" };

// The home page (/): the calendar with the details panel beside it.
export default function Page() {
  return (
    <Protected roles={ONBOARDING_ROLES}>
      <Dashboard />
    </Protected>
  );
}

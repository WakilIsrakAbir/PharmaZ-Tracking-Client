import { Dashboard } from "@/components/dashboard/Dashboard";
import { Protected } from "@/components/layout/Protected";

export const metadata = { title: "Dashboard" };

// The home page (/): the calendar with the details panel beside it.
export default function Page() {
  return (
    <Protected>
      <Dashboard />
    </Protected>
  );
}

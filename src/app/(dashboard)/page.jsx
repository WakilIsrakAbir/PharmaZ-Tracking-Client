import { Dashboard } from "@/components/Dashboard";
import { Protected } from "@/components/Protected";

export const metadata = { title: "Dashboard" };

// The home page (/): the calendar with the details panel beside it.
export default function Page() {
  return (
    <Protected>
      <Dashboard />
    </Protected>
  );
}

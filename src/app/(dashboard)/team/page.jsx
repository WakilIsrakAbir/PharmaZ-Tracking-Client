import { Protected } from "@/components/Protected";
import { TeamPage } from "@/components/TeamPage";

export const metadata = { title: "Team" };

// Admins only: marketing users are sent back to the dashboard.
export default function Page() {
  return (
    <Protected admin>
      <TeamPage />
    </Protected>
  );
}

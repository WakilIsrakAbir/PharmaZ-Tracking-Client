import { Protected } from "@/components/layout/Protected";
import { TeamPage } from "@/components/team/TeamPage";

export const metadata = { title: "Team" };

// Admins only: marketing users are sent back to the dashboard.
export default function Page() {
  return (
    <Protected admin>
      <TeamPage />
    </Protected>
  );
}

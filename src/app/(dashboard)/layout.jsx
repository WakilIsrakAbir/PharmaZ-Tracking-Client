import { Suspense } from "react";

import { AppShell } from "@/components/app-shell/AppShell";
import { getSessionUser } from "@/lib/session";

// Every signed-in page: the sidebar (large screens) or top bar (phones) around the page.
// Each page checks who is signed in itself (components/layout/Protected.jsx).
export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <Suspense>
        <Shell>{children}</Shell>
      </Suspense>
    </div>
  );
}

// Starts loading the user without waiting; the parts that need it wait on their own.
// If the API can't be reached, the frame still shows (without the account button),
// and the page itself says it didn't load (error.jsx) with a "Try again" button.
function Shell({ children }) {
  const userPromise = getSessionUser().catch(() => null);
  return <AppShell userPromise={userPromise}>{children}</AppShell>;
}

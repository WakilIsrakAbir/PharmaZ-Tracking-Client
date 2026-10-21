import { Suspense } from "react";

import { AppShell } from "@/components/AppShell";
import { getSessionUser } from "@/lib/session";

// Every signed-in page: the sidebar (large screens) or top bar (phones) around the page.
// Each page checks who is signed in itself (components/Protected.jsx).
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
function Shell({ children }) {
  return <AppShell userPromise={getSessionUser()}>{children}</AppShell>;
}

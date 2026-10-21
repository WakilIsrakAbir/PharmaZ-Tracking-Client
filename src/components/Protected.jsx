import { Suspense } from "react";

import { PageSkeleton } from "@/components/common";
import { requireAdmin, requireUser } from "@/lib/session";

// Wrap the content of every signed-in page:
//   <Protected>…</Protected>        any signed-in user
//   <Protected admin>…</Protected>  admins only (everyone else goes to the dashboard)
// The check sits in each page, not in the layout, because Next.js doesn't re-run
// layouts when you move between pages.
export function Protected({ admin = false, children }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Gate admin={admin}>{children}</Gate>
    </Suspense>
  );
}

// Waits for the sign-in check; it redirects (to /login or /) when the check fails.
async function Gate({ admin, children }) {
  if (admin) await requireAdmin();
  else await requireUser();
  return children;
}

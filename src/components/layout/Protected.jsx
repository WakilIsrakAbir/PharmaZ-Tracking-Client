import { Suspense } from "react";

import { PageSkeleton, ServerUnreachable } from "@/components/shared/common";
import { isServerUnreachable, requireAdmin, requireUser, unreachableReason } from "@/lib/session";

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
// When the API doesn't answer, it says so calmly instead, and the page keeps trying by itself.
async function Gate({ admin, children }) {
  try {
    if (admin) await requireAdmin();
    else await requireUser();
  } catch (error) {
    if (isServerUnreachable(error)) return <ServerUnreachable reason={unreachableReason(error)} />;
    throw error; // the redirects work by throwing, so everything else passes on
  }
  return children;
}

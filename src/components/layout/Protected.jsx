import { Suspense } from "react";

import { PageSkeleton, ServerUnreachable } from "@/components/shared/common";
import { isServerUnreachable, requireRole, requireUser, unreachableReason } from "@/lib/session";

// Wrap the content of every signed-in page:
//   <Protected>…</Protected>                          any signed-in user (the Account page)
//   <Protected roles={ONBOARDING_ROLES}>…</Protected>  only these roles; anyone else goes to their own home page
//   <Protected admin>…</Protected>                    admins only
// The check sits in each page, not in the layout, because Next.js doesn't re-run
// layouts when you move between pages.
export function Protected({ admin = false, roles = null, children }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Gate roles={admin ? ["admin"] : roles}>{children}</Gate>
    </Suspense>
  );
}

// Waits for the sign-in check; it redirects (to /login, or to the person's home page) when the check fails.
// When the API doesn't answer, it says so calmly instead, and the page keeps trying by itself.
async function Gate({ roles, children }) {
  try {
    if (roles) await requireRole(roles);
    else await requireUser();
  } catch (error) {
    if (isServerUnreachable(error)) return <ServerUnreachable reason={unreachableReason(error)} />;
    throw error; // the redirects work by throwing, so everything else passes on
  }
  return children;
}

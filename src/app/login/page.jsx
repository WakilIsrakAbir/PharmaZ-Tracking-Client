import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/AuthShell";
import { ChoosePasswordForm, LoginForm } from "@/components/LoginForm";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionUser } from "@/lib/session";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<FormSkeleton />}>
        <SignIn />
      </Suspense>
    </AuthShell>
  );
}

// Already signed in → the dashboard.
// Signed in but still on a temporary password → choose your own first.
// Otherwise → the sign-in form.
async function SignIn() {
  const user = await getSessionUser();
  if (user && !user.mustChangePassword) redirect("/");
  if (user) return <ChoosePasswordForm name={user.name} />;
  return <LoginForm />;
}

function FormSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-6 h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

import Link from "next/link";

import { LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Page not found" };

// Shown for any address that doesn't exist.
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 text-center">
      <LogoMark className="size-11" />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">The link may be old, or the page may have moved.</p>
      <Button asChild className="mt-8">
        <Link href="/">Go to the dashboard</Link>
      </Button>
    </main>
  );
}

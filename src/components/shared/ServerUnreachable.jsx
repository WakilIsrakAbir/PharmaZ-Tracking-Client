"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WifiOff } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

// When the API can't be used (see components/layout/Protected.jsx). `reason` is what the API said, for
// example that it can't reach its database and how to fix that. The page tries again by itself
// every 10 seconds, so it recovers on its own as soon as the problem is fixed.
export function ServerUnreachable({ reason }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(timer);
  }, [router]);

  const tryingAgain = "This page tries again every 10 seconds.";
  let title = "We can't reach the server right now";
  let description = `Please check your internet connection. ${tryingAgain}`;
  if (reason) {
    title = "The server can't reach its database";
    description = `${reason} ${tryingAgain}`;
  } else if (process.env.NODE_ENV === "development") {
    description = `The API isn't answering. Is it running? Check the terminal where you ran npm run dev. ${tryingAgain}`;
  }

  return (
    <EmptyState
      icon={WifiOff}
      title={title}
      description={description}
      action={<Button onClick={() => router.refresh()}>Try again now</Button>}
    />
  );
}

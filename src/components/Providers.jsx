"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";

// Wraps the whole app (see app/layout.jsx):
//   • TanStack Query loads data from the API and keeps it up to date
//   • Toaster shows the small "Saved" and error messages at the top of the screen

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data counts as fresh for 30 seconds, then reloads in the background.
        staleTime: 30_000,
        // Try again only when the server had a hiccup, not when the request itself was wrong.
        retry: (failureCount, error) => error?.status >= 500 && failureCount < 2,
      },
    },
  });
}

// A new client for every page the server renders; one shared client in the browser.
let browserQueryClient;
function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

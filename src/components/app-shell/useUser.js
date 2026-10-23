"use client";

import { createContext, use } from "react";

// The signed-in user, shared with every page by AppShell (it holds the promise from the layout).
export const UserContext = createContext(null);

// The signed-in user (or null) in any client component. Call it inside <Suspense>.
export function useUser() {
  const userPromise = use(UserContext);
  return userPromise ? use(userPromise) : null;
}

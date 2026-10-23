"use client";

// The frame around every signed-in page:
//   • large screens: a sidebar with the logo, the menu and the account button. Its hamburger button
//     folds it into a narrow strip of icons (more room for the page), and opens it again (Sidebar.jsx).
//   • phones: a top bar with a menu button, the logo and the account button (TopBar.jsx)
// It also shares the signed-in user with every page (useUser.js).

import { Sidebar } from "@/components/app-shell/Sidebar";
import { TopBar } from "@/components/app-shell/TopBar";
import { UserContext } from "@/components/app-shell/useUser";

export function AppShell({ userPromise, children }) {
  return (
    <UserContext value={userPromise}>
      <Sidebar />
      <div className="transition-[padding] duration-200 motion-reduce:transition-none lg:pl-64 sidebar-collapsed:pl-18">
        <TopBar />
        <main className="mx-auto w-full max-w-360 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </UserContext>
  );
}

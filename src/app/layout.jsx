import { Hind_Siliguri, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/components/layout/Providers";
import { SIDEBAR_STORAGE_KEY } from "@/lib/constants";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// Only downloaded when Bangla text appears on the page (e.g. a doctor's name).
const bangla = Hind_Siliguri({
  variable: "--font-bangla",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

export const metadata = {
  title: {
    default: "PharmaZ247 Tracker",
    template: "%s · PharmaZ247 Tracker",
  },
  description: "Fill in doctor and pharmacy onboarding forms, see every visit on one calendar, and track each one's status.",
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: "#1e2a5e",
};

// Runs in <head>, before anything is drawn: if this browser folded the sidebar last time, fold it
// now, so it doesn't open and then jump shut. (The sidebar's hamburger button changes it: components/app-shell/useSidebar.js.)
const foldSidebarScript = `try {
  if (localStorage.getItem("${SIDEBAR_STORAGE_KEY}") === "collapsed") document.documentElement.dataset.sidebar = "collapsed";
} catch {}`;

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the script below may add data-sidebar to <html> before React starts.
    <html lang="en" className={`${jakarta.variable} ${bangla.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: foldSidebarScript }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

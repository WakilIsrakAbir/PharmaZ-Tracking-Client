import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { homePage } from "@/lib/constants";

// Who is signed in, checked on the server. The API stays the real lock;
// this only decides which pages to show.

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const SESSION_COOKIE = "pz_session";

// The API can't be used right now: it doesn't answer at all (not running), or it answers 503
// because it can't reach its database. Pages catch this and show a calm message with the
// API's reason, when it gave one (components/layout/Protected.jsx).
// The reason travels inside the message ("SERVER_UNREACHABLE: <reason>"), because an error
// thrown inside a cached function keeps only its message.
const SERVER_UNREACHABLE = "SERVER_UNREACHABLE";
const serverUnreachable = (reason) => new Error(reason ? `${SERVER_UNREACHABLE}: ${reason}` : SERVER_UNREACHABLE);
export const isServerUnreachable = (error) => Boolean(error?.message?.startsWith(SERVER_UNREACHABLE));
export const unreachableReason = (error) => error.message.slice(`${SERVER_UNREACHABLE}: `.length) || null;

// The signed-in user, or null. 'use cache: private' keeps the answer in this browser only,
// so moving between pages doesn't ask the API every time. Call it inside <Suspense>.
export async function getSessionUser() {
  "use cache: private";

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let response;
  try {
    response = await fetch(`${API_URL}/api/v1/auth/me`, { headers: { Cookie: `${SESSION_COOKIE}=${token}` } });
  } catch (error) {
    // A warning, not an error: it's expected while the API starts. The API's own terminal says why.
    console.warn(`⚠ Can't reach the API at ${API_URL} (${error.cause?.code ?? error.message}). Is it running?`);
    throw serverUnreachable();
  }
  // 503: the API can't reach its database (it says why). Any other 5xx is the host having a bad
  // moment (a cold start, a timeout): the same calm page, which tries again by itself.
  if (response.status >= 500) {
    const body = await response.json().catch(() => null);
    throw serverUnreachable(response.status === 503 ? body?.error?.message : null);
  }
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`The API could not load your account (status ${response.status}).`);

  const { data: user } = await response.json();
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
  };
}

// For pages inside the app: not signed in (or still on a temporary password) → /login.
export async function requireUser() {
  const user = await getSessionUser();
  if (!user || user.mustChangePassword) redirect("/login");
  return user;
}

// For the pages of one part of the app: people with another role go to their own home page
// (the dashboard, or the call log for the support team).
export async function requireRole(roles) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(homePage(user.role));
  return user;
}

// For admin-only pages.
export const requireAdmin = () => requireRole(["admin"]);

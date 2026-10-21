import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Who is signed in, checked on the server. The API stays the real lock;
// this only decides which pages to show.

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const SESSION_COOKIE = "pz_session";

// The signed-in user, or null. 'use cache: private' keeps the answer in this browser only,
// so moving between pages doesn't ask the API every time. Call it inside <Suspense>.
export async function getSessionUser() {
  "use cache: private";

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const response = await fetch(`${API_URL}/api/v1/auth/me`, { headers: { Cookie: `${SESSION_COOKIE}=${token}` } });
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

// For admin-only pages: everyone else goes back to the dashboard.
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}

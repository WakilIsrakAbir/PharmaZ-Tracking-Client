// Where to go after signing in: the page that sent you here (?next=…), or the dashboard.
// Only pages of this app are allowed, never another website.
export function pageAfterSignIn() {
  const next = new URLSearchParams(window.location.search).get("next");
  const isPageOfThisApp = next?.startsWith("/") && !next.startsWith("//");
  return isPageOfThisApp ? next : "/";
}

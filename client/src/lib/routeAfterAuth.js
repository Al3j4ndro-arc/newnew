// client/src/lib/routeAfterAuth.js
export async function routeAfterAuth(history) {
  try {
    const me = await fetch("/api/me", { credentials: "include" }).then(r => r.json());
    const hasCY = !!me?.data?.classYear;   // stored at userData.classYear by /api/me/profile
    history.push(hasCY ? "/events" : "/profile?first=1");
  } catch {
    history.push("/events");
  }
}

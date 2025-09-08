export async function routeAfterAuth(history) {
  const me = await fetch("/api/me", { credentials: "include", cache: "no-store" })
    .then(r => r.json()).catch(() => ({}));
  const d = me?.data || {};

  // Only treat INTERNAL headshot as completion
  const hasInternalHeadshot = !!(d.internalHeadshot || d.internalHeadshotUrl);
  const hasYear = !!(d.classYear || d.userData?.classYear || d.userData?.application?.classYear);

  if (!hasInternalHeadshot) return history.push("/onboarding");
  if (!hasYear)             return history.push("/profile?first=1");
  return history.push("/events");
}

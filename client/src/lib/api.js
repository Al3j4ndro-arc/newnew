export async function api(path, opts = {}) {
  const res = await fetch(`/api${path.startsWith("/") ? path : `/${path}`}`, {
    credentials: "include",
    // allow callers to override/extend (e.g., { cache: "no-store" })
    ...opts,
    headers: {
      "Accept": "application/json",
      ...(opts.headers || {})
    }
  });

  if (!res.ok) {
    let msg = "Request failed";
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch { /* no body */ }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  // Gracefully handle 204 No Content
  if (res.status === 204) return { ok: true };

  // Some endpoints may return empty JSON; guard that
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export async function routeAfterAuth(history) {
  try {
    const me = await fetch("/api/me", { credentials: "include" }).then(r => r.json());
    const hasCY = !!me?.data?.classYear;
    history.push(hasCY ? "/events" : "/profile?first=1");
  } catch {
    history.push("/events");
  }
}

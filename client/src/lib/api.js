export async function api(path, { method = "GET", body, headers, ...rest } = {}) {
  const opts = {
    method,
    credentials: "include",                 // ← always send cookies
    headers: { "Content-Type": "application/json", ...(headers || {}) },
    ...rest,
  };
  if (body !== undefined && method !== "GET") {
    opts.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const url = path.startsWith("/api") ? path : `/api${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, opts);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
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

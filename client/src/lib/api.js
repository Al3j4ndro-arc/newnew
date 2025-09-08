export async function api(path, opts = {}) {
  const url = "/api" + (path.startsWith("/") ? path : `/${path}`);

  const headers = { Accept: "application/json", ...(opts.headers || {}) };

  let body = opts.body;
  const isForm =
    typeof FormData !== "undefined" && body instanceof FormData;
  const isBlob =
    typeof Blob !== "undefined" && body instanceof Blob;

  // ✅ stringify plain objects and set Content-Type
  if (body && typeof body !== "string" && !isForm && !isBlob) {
    body = JSON.stringify(body);
    if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    credentials: "include",
    ...opts,
    headers,
    body,
  });

  if (!res.ok) {
    let msg = "Request failed";
    try { msg = (await res.json()).message || msg; } catch {}
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return { ok: true };
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

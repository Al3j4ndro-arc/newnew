import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { api } from "../lib/api.js";

export default function Profile() {
  const history = useHistory();
  const { search } = useLocation();
  const isFirst = new URLSearchParams(search).get("first"); // optional flag

  const [classYear, setClassYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // On load: read classYear from /api/me (handling all places it might live).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await api("/me");
        const cy =
          me?.data?.classYear ??
          me?.data?.userData?.classYear ??
          me?.data?.userData?.application?.classYear ??
          "";
        if (!alive) return;
        setClassYear(cy || "");
        // If class year already set, skip to events (unless explicitly first-run)
        if (cy && !isFirst) history.replace("/events");
      } catch {
        /* not logged in → stay here */
      }
    })();
    return () => { alive = false; };
  }, [history, isFirst]);

   // ⬇️ Add THIS dev helper effect here
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return; // optional safety
    window._go = (p = "/events") => { console.debug("nav->", p); history.replace(p); };
    return () => { delete window._go; };
  }, [history]);

  async function save(e) {
  e?.preventDefault?.();
  setMsg("");

  if (!/^\d{4}$/.test(classYear)) {
    setMsg("Please enter a 4-digit year (e.g., 2027).");
    return;
  }

  setSaving(true);
  try {
    // 1) persist
    await api("/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classYear }),
    });

    // 2) refresh /me with no cache (so any guards won’t read stale data)
    await fetch("/api/me", {
      credentials: "include",
      cache: "no-store",
      headers: { "Cache-Control": "no-store" },
    });

    // 3) go to events (replace avoids lingering /profile?first=1 in history)
    setMsg("Saved!");
    console.debug("[profile] navigating to /events");
    setTimeout(() => history.replace("/events"), 120);
  } catch (err) {
    setMsg(err?.message || "Failed to save");
  } finally {
    setSaving(false);
  }
}

  return (
    <form onSubmit={save} className="space-y-4 md:space-y-6">
      <h2 className="text-xl font-semibold">Your Profile</h2>

      <label className="block text-sm font-medium">Class Year</label>
      <input
        className="bg-gray-50 border border-gray-300 rounded-lg p-2.5 w-full"
        value={classYear}
        onChange={(e) => setClassYear(e.target.value)}
        inputMode="numeric"
        placeholder="2027"
      />

      <button
        type="submit"
        disabled={saving}
        className="text-sm h-10 px-5 text-white bg-red-700 rounded-lg hover:bg-red-800 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </button>

      {!!msg && <p className="text-sm">{msg}</p>}
    </form>
  );
}

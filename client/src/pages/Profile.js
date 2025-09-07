import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

export default function Profile() {
  const history = useHistory();
  const [classYear, setClassYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then(r => r.json())
      .then(({ data }) => setClassYear(data?.classYear || ""))
      .catch(() => {});
  }, []);

  async function save() {
    setMsg("");
    if (!/^\d{4}$/.test(classYear)) {
      setMsg("Please enter a 4-digit year (e.g., 2027).");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ classYear }),
      });
      if (!res.ok) {
        const b = await res.json().catch(()=>({}));
        throw new Error(b.message || "Failed to save");
      }
      setMsg("Saved!");
      // pull back the value we just saved (and keep /api/me fresh)
     const me = await fetch("/api/me", { credentials: "include" }).then(r => r.json());
     setClassYear(me?.data?.classYear || classYear);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-xl font-semibold">Your Profile</h2>
      <label className="block text-sm font-medium">Class Year</label>
      <input
        className="bg-gray-50 border border-gray-300 rounded-lg p-2.5 w-full"
        value={classYear}
        onChange={(e)=>setClassYear(e.target.value)}
        placeholder="2027"
      />
      <button
        onClick={save}
        disabled={saving}
        className="text-sm h-10 px-5 text-white bg-red-700 rounded-lg hover:bg-red-800 disabled:opacity-60"
      >
        Save
      </button>
      {!!msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}

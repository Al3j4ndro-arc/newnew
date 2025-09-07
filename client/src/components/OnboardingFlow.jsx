// client/src/components/onboarding/OnboardingFlow.jsx
import React, { useMemo, useRef, useState, useCallback } from "react";
import confetti from "canvas-confetti";

function celebrate() {
  confetti({ particleCount: 90, spread: 65, startVelocity: 45, origin: { x: 0.2, y: 0.6 } });
  confetti({ particleCount: 90, spread: 65, startVelocity: 45, origin: { x: 0.8, y: 0.6 } });
}

export default function OnboardingFlow({ user, onDone }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [preview, setPreview]     = useState("");
  const [error, setError]         = useState("");
  const [doneOnce, setDoneOnce]   = useState(Boolean(user.internalHeadshot));

  const fileRef = useRef(null);

  const avatarUrl = useMemo(
    () => preview || user.internalHeadshot || user.headshot || "",
    [preview, user]
  );
  const initials = useMemo(() => {
    const f = (user.firstname || "").trim()[0] || "";
    const l = (user.lastname  || "").trim()[0] || "";
    return (f + l || "🙂").toUpperCase();
  }, [user]);

  const selectFile = () => fileRef.current?.click();

  const validate = (file) => {
    if (!file) return "No file selected.";
    if (!file.type.startsWith("image/")) return "Please upload an image file.";
    if (file.size > 6 * 1024 * 1024) return "Please keep images under 6MB.";
    return "";
  };

  const handleFile = useCallback(async (file) => {
    const v = validate(file);
    if (v) { setError(v); return; }

    setError("");
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setProgress(10);

    try {
      // 1) presign
      const meta = await fetch("/api/uploads/internal-headshot-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contentType: file.type }),
      }).then(r => r.json());
      setProgress(25);

      if (!meta?.uploadUrl) {
            throw new Error(meta?.message || "Could not get upload URL");
            }

      // 2) upload
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", meta.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(25 + Math.round((e.loaded / e.total) * 60)); // 25→85
          }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject());
        xhr.onerror = reject;
        xhr.send(file);
      });

      // 3) save URL
      await fetch("/api/me/internal-headshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: meta.fileUrl }),
      });

      setProgress(100);
      setUploading(false);
      setDoneOnce(true);
      celebrate();
    } catch (e) {
      console.error(e);
      setError("Upload failed. Try another image.");
      setUploading(false);
      setProgress(0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Maintenance-style card */}
        <div className="rounded-3xl bg-white shadow-2xl shadow-gray-200 ring-1 ring-black/5 p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
            Welcome, {user.firstname}
          </h1>

          <p className="mt-4 text-xl text-gray-700">
            You’re signed in. Next, you can <strong>optionally</strong> add a headshot for our internal roster.
          </p>

          {/* Step list (compact, like a timeline that fills) */}
          <ol className="mt-8 space-y-5">
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                ✓
              </span>
              <div>
                <p className="font-semibold text-gray-900">Sign in with Google</p>
                <p className="text-sm text-gray-500">Done — you’re verified.</p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full
                ${doneOnce ? "bg-green-500 text-white" : "bg-blue-600 text-white"}`}>
                {doneOnce ? "✓" : "2"}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  Upload your headshot <span className="text-gray-400 font-normal">(optional)</span>
                </p>
                <p className="text-sm text-gray-500">For our internal roster only.</p>

                {/* Uploader card */}
                <div className="mt-4 grid gap-5 sm:grid-cols-[auto,1fr] items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-20 w-20 rounded-full ring-1 ring-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center text-lg font-semibold text-gray-500">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Current avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">Current</span>
                  </div>

                  <div>
                    <label
                      onClick={() => fileRef.current?.click()}
                      className={[
                        "block w-full cursor-pointer rounded-xl border-2 border-dashed p-5 transition",
                        uploading ? "opacity-70 pointer-events-none" : "hover:border-gray-400",
                        "border-gray-300 bg-gray-50/50",
                      ].join(" ")}
                    >
                      <p className="font-medium text-gray-800">
                        Drag & drop an image here, or <span className="underline">click to choose</span>
                      </p>
                      <p className="mt-1 text-xs text-gray-500">PNG/JPG, &lt; 6MB</p>

                      {uploading && (
                        <div className="mt-4 h-2 w-full rounded bg-gray-200 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </label>

                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-50"
                        disabled={uploading}
                      >
                        Choose image
                      </button>
                      <span className="text-xs text-gray-500">We’ll store this securely for internal use only.</span>
                    </div>

                    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                  </div>
                </div>
              </div>
            </li>
          </ol>

          {/* Footer actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => { celebrate(); onDone(); }}
              className="inline-flex items-center justify-center rounded-xl bg-red-700 text-white px-5 py-3 text-sm font-medium hover:bg-red-800"
              disabled={uploading}
            >
              {doneOnce ? "Continue" : "Skip for now"}
            </button>

            {doneOnce && (
              <span className="self-center text-sm text-gray-500">
                Headshot saved — you can change it later.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

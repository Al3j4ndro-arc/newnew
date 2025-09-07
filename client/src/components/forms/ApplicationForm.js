import React, { useEffect, useState } from "react";
import validator from "validator";

export default function ApplicationForm() {
  const [me, setMe] = useState(null);
  const [isMitSession, setIsMitSession] = useState(false);

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname]   = useState("");
  const [email, setEmail]         = useState("");
  const [hasHeadshot, setHasHeadshot] = useState(false);

  const [classYear, setClassYear] = useState("");
  const [profileImg, setProfileImg] = useState(""); // Data URL when chosen
  const [resume, setResume] = useState("");         // Data URL
  const [opt1, setOpt1] = useState("");

  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [open, setOpen] = useState(true);

  // Prefill from /api/me and /api/application if you want to show saved values
  useEffect(() => {
  fetch("/api/me")
    .then((r) => r.json())
    .then((res) => {
      // after we fetch /api/me
        const m = res?.data || {};
        setMe(m);
        setIsMitSession(/@mit\.edu$/i.test(m?.email || ""));
        setHasHeadshot(Boolean(m.internalHeadshotUrl || m.headshotUrl));  // <-- add
        setFirstname(m.firstname ?? "");
        setLastname(m.lastname ?? "");
        setEmail(m.email ?? "");
    })
    .catch(() => {});

    // previously saved app (optional)
    fetch("/api/application/get-application")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(result => {
        const a = result?.application || {};
        if (a.classYear) setClassYear(a.classYear);
        if (a.opt1) setOpt1(a.opt1);
        // don’t prefill resume/profileImg for security/UX
      })
      .catch(() => {});
  }, []);

  const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB client-side guard

  const handleProfileUpload = (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError("Profile image is too large. Please choose a smaller file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfileImg(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleResumeUpload = (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError("Resume is too large. Please upload a file up to 20 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setResume(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const submitApplication = () => {
    setError("");

    // server enforces MIT email via token; this is just a friendly check if visible
    if (!isMitSession && email && !/@mit\.edu$/i.test(email)) {
        setError("Please use an @mit.edu email.");
        return;
        }

    if (!classYear || !validator.isNumeric(String(classYear))) {
      setError("Please enter a valid class year (e.g., 2027).");
      return;
    }
    if (!resume) {
      setError("Please upload your resume.");
      return;
    }
    // profile image required only if user didn't have one already
    if (!hasHeadshot && !profileImg) {
      setError("Please upload a profile image.");
      return;
    }

    // Figure out which email we’ll send:
    const effectiveEmail = isMitSession ? (me?.email || "") : email.trim();

    const payload = {
        classYear,
        resume,            // data URL
        opt1,
        ...(profileImg ? { profileImg } : {}),
        ...(!isMitSession ? { email: effectiveEmail } : {}),  // <-- include only when needed
        };

    if (!validator.isEmail(effectiveEmail)) {
        setError("Please enter a valid email address");
        return;
    }
    if (!/@mit\.edu$/i.test(effectiveEmail)) {
        setError("Please use an @mit.edu email");
        return;
    }

    fetch("/api/application/submit-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (res.ok) {
          setSubmitted(true);
          setError("");
        } else {
          const body = await res.json().catch(() => ({}));
          setError(body?.message || "Submission failed.");
        }
      })
      .catch((e) => setError(e?.message || "Network error."));
  };

  return !open ? (
    <div className="space-y-4 md:space-y-6">
      <h3>
        Our application for the Fall 2025 cycle is closed.
        <br /><br />
        Questions? Email <a className="hover:text-blue-600" href="mailto:ale12@mit.edu">ale12@mit.edu</a>.
      </h3>
    </div>
  ) : (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h3>
          You may only submit your application once before the deadline. Be sure to press
          the submit button at the bottom of the page when you are done!
          <br /><br />
          Need help? <a className="hover:text-blue-600" href="mailto:ale12@mit.edu">ale12@mit.edu</a>
        </h3>
      </div>

      {/* You can keep showing name/email, but we’ll not require them on submit */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">First Name</label>
        <input
          type="text"
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">Last Name</label>
        <input
          type="text"
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
            Your MIT Email
            </label>
            <input
            type="email"
            className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 disabled:opacity-70"
            placeholder="kerb@mit.edu"
            value={isMitSession ? (me?.email || "") : email}
            disabled={isMitSession}
            onChange={(e) => {
                if (!isMitSession) {
                setError("");
                setEmail(e.target.value);
                }
            }}
            />
            <p className="text-sm text-gray-500 mt-1">
            {isMitSession
                ? "Email comes from your login."
                : "Enter your @mit.edu email (required if you didn’t log in with MIT)."}
            </p>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">Class Year</label>
        <input
          placeholder="Ex: 2027"
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
          value={classYear}
          onChange={(e) => setClassYear(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Profile Image {hasHeadshot ? <span className="text-gray-500">(optional)</span> : <span className="text-red-600">*</span>}
        </label>
        <input
          className="block w-full text-sm font-medium text-gray-900 border border-gray-300 rounded-lg p-1.5 cursor-pointer bg-gray-50"
          type="file"
          accept="image/*"
          onChange={(e) => handleProfileUpload(e.target.files?.[0])}
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">Resume Upload *</label>
        <input
          className="block w-full text-sm font-medium text-gray-900 border border-gray-300 rounded-lg p-1.5 cursor-pointer bg-gray-50"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => handleResumeUpload(e.target.files?.[0])}
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Optional: What do you hope to gain from MCG?
        </label>
        <textarea
          className="p-2 resize-none bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full h-48"
          value={opt1}
          onChange={(e) => setOpt1(e.target.value)}
        />
      </div>

      <button
        onClick={submitApplication}
        className="text-sm h-10 px-5 text-white bg-red-700 rounded-lg hover:bg-red-800"
      >
        Submit Application
      </button>

      {submitted && <p className="text-green-600">Submitted successfully!</p>}
      {!!error && <p className="text-red-600">{String(error)}</p>}
    </div>
  );
}

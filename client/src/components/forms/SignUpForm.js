import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import validator from "validator";

export default function SignUpForm() {
  const history = useHistory();

  const [firstname, setFirstName] = useState("");
  const [lastname,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");

  // headshot
  const [profileFile, setProfileFile] = useState(null);
  const [previewUrl,  setPreviewUrl]  = useState("");

  const [error, setError] = useState("");

  const validateEmail = (email) =>
    String(email).toLowerCase().match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );

  const handleProfileFile = (file) => {
    if (!file) return;
    setProfileFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const submitSignup = async () => {
    setError("");

    if (!validateEmail(email) || !validator.isEmail(email) || !email.endsWith("@mit.edu")) {
      setError("Please enter a valid MIT email address");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (firstname.trim().length < 1 || lastname.trim().length < 1) {
      setError("First and last name must be at least 1 character long");
      return;
    }
    if (!validator.isAlpha(firstname.replace(/\s/g, "")) ||
        !validator.isAlpha(lastname.replace(/\s/g, ""))) {
      setError("First and last name must only contain letters");
      return;
    }

    let headshotUrl = null;

    // Optional S3 upload via presigned URL
    if (profileFile) {
      try {
        const metaRes = await fetch("/api/uploads/headshot-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: profileFile.type }),
        });
        if (!metaRes.ok) throw new Error("Upload init failed");
        const { uploadUrl, fileUrl } = await metaRes.json();

        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": profileFile.type },
          body: profileFile,
        });
        if (!putRes.ok) throw new Error("Upload failed");

        headshotUrl = fileUrl;
      } catch (e) {
        console.error(e);
        setError("Could not upload image. You can try again or sign up without it.");
      }
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ firstname, lastname, email, password, headshotUrl }),
    });

    if (res.ok) {
      history.push("/events"); // or "/login" if you prefer
    } else {
      const j = await res.json().catch(() => ({ message: "Signup failed" }));
      setError(j.message);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">

      {/* First Name */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          First Name
        </label>
        <input
          type="text"
          name="firstname"
          id="firstname"
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
          value={firstname}
          onChange={(e) => { setError(""); setFirstName(e.target.value); }}
        />
      </div>

      {/* Last Name */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Last Name
        </label>
        <input
          type="text"
          name="lastname"
          id="lastname"
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
          value={lastname}
          onChange={(e) => { setError(""); setLastName(e.target.value); }}
        />
      </div>

      {/* Email */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Your email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          placeholder="kerb@mit.edu"
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
          value={email}
          onChange={(e) => { setError(""); setEmail(e.target.value); }}
        />
      </div>

      {/* Password */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          placeholder="••••••••"
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
          value={password}
          onChange={(e) => { setError(""); setPassword(e.target.value); }}
          onKeyUp={(e) => { if (e.key === "Enter") submitSignup(); }}
        />
      </div>

      {/* Headshot (optional) */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Headshot (optional)
        </label>
        <input
          type="file"
          accept="image/*"
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 cursor-pointer"
          onChange={(e) => handleProfileFile(e.target.files?.[0] || null)}
        />
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="mt-2 h-20 w-20 rounded-full object-cover"
          />
        )}
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <button
        onClick={submitSignup}
        className="text-sm h-10 px-5 text-white transition-colors duration-150 bg-red-700 rounded-lg focus:shadow-outline hover:bg-red-800"
      >
        Sign Up
      </button>

      <p className="text-sm font-light text-gray-500">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-primary-600 hover:underline">
          Login
        </a>
      </p>
    </div>
  );
}

// client/src/components/forms/LoginForm.js
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import validator from "validator";
import GoogleButton from "../auth/GoogleButton.jsx";
import { routeAfterAuth } from "../../lib/routeAfterAuth.js";

Object.defineProperty(String.prototype, "capitalize", {
  value: function () { return this.charAt(0).toUpperCase() + this.slice(1); },
  enumerable: false,
});

export default function LoginForm({ onSuccess }) {
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [error, setError]     = useState("");
  const history               = useHistory();

  const submitLogin = async () => {
    if (!validator.isEmail(email)) {
      setError("please enter a valid email");
      return;
    }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.message || "login failed");
        return;
      }

      // ✅ unify with Google flow
      if (onSuccess) return onSuccess();
      await routeAfterAuth(history);

    } catch (e) {
      setError(e.message || "network error");
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="flex flex-col items-center justify-center px-6 mx-auto md:h-screen lg:py-0">
        <div className="mb-4 w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold text-center text-gray-900">Login</h1>

            <div className="flex justify-center">
              <GoogleButton
                text="continue_with"
                onSuccess={onSuccess ?? (() => routeAfterAuth(history))}
                onError={(msg) => setError(msg || "Google login failed")}
              />
            </div>

            {/* Email/password fallback */}
            <div className="space-y-3 pt-4">
              <input
                type="email"
                className="bg-gray-50 border border-gray-300 rounded-lg p-2.5 w-full"
                placeholder="kerb@mit.edu"
                value={email}
                onChange={(e) => { setError(""); setEmail(e.target.value); }}
              />
              <input
                type="password"
                className="bg-gray-50 border border-gray-300 rounded-lg p-2.5 w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setError(""); setPass(e.target.value); }}
                onKeyUp={(e) => { if (e.key === "Enter") submitLogin(); }}
              />
              <button
                onClick={submitLogin}
                className="w-full text-white bg-red-700 hover:bg-red-800 rounded-lg text-sm px-5 py-2.5"
              >
                Login
              </button>
            </div>

            {error && <p className="text-red-500">{error.capitalize()}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

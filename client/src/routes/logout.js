import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import PublicHeader from "../components/headers/PublicHeader.js";

export default function Logout() {
  const history = useHistory();

  async function clearToken() {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      // Either way, send them to login
      history.replace("/login");
    } catch {
      history.replace("/login");
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      clearToken();
    }
  }, []); // run once

  return (
    <div>
      <PublicHeader />
      <div className="flex flex-col items-center justify-center px-6 mx-auto md:h-screen lg:py-0">
        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold text-center leading-tight tracking-tight text-gray-900">
              Logging out...
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}

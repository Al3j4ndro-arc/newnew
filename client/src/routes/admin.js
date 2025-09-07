// client/src/routes/Admin.js (or wherever this file lives)
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import Header from "../components/headers/Header.js";
import AdminPanel from "../components/forms/AdminForm.js";
import { api } from "../lib/api.js";

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const history = useHistory();

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await api("/me", { signal: controller.signal }); // sends cookies
        if (!alive) return;

        if (res?.data?.usertype !== "admin") {
          history.push("/login");
          return;
        }

        setMe(res.data);
      } catch {
        history.push("/login");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [history]); // <-- was "navigate"

  if (loading) return null;

  return (
    <div>
      <Header
        firstname={me.firstname}
        usertype={me.usertype}
        headshot={me.headshot}
      />

      <div className="flex flex-col items-center justify-center px-6 mx-auto md:h-screen lg:py-0">
        <div className="mb-4 w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              Admin Panel
            </h1>
            <AdminPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

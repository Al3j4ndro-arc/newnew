// client/src/routes/Application.js
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import Header from "../components/headers/Header.js";
import ApplicationForm from "../components/forms/ApplicationForm.js";
import { api } from "../lib/api.js";

export default function Application() {
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
        setMe(res.data);
      } catch {
        if (alive) history.push("/login");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [history]);

  if (loading) return null;

  return (
    <div className="bg-gray-50">
      <Header
        firstname={me.firstname}
        usertype={me.usertype}
        headshot={me.headshot}          // now supports internal or google URL
      />

      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-2xl lg:max-w-4xl xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              MCG Fall 2025 Application
            </h1>
            <ApplicationForm />
          </div>
        </div>
      </div>
    </div>
  );
}

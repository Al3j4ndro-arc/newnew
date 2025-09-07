// client/src/routes/Events.js
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import Header from "../components/headers/Header.js";
import EventsForm from "../components/forms/EventsForm.js";
import { api } from "../lib/api.js"; // adjust path if needed

export default function Events() {
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
        if (!res?.data?.classYear) {
         history.push("/profile?first=1");
         return;
       }
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
    <div>
      <Header
        firstname={me.firstname}
        usertype={me.usertype}
        headshot={me.headshot}
      />
      <div className="bg-gray-50 pb-6">
        <h1 className="pt-8 mb-8 text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
          Welcome to MCG&apos;s Fall 2025 Recruitment Cycle Events
        </h1>
        <EventsForm usertype={me.usertype} />
      </div>
    </div>
  );
}

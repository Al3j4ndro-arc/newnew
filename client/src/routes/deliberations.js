// client/src/routes/Deliberations.js
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import Header from "../components/headers/Header.js";
import DeliberationsForm from "../components/forms/DeliberationsForm.js";
import { api } from "../lib/api.js";

export default function Deliberations() {
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
  }, [history]);

  if (loading) return null;

  return (
    <div>
      <Header
        firstname={me.firstname}
        usertype={me.usertype}
        headshot={me.headshot}
      />
      <div className="mx-8 my-8">
        <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
          Deliberations Control Panel
        </h1>
        <DeliberationsForm />
      </div>
    </div>
  );
}

// client/src/routes/Conflict.js  (filename optional; your component is currently named "Events")
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import Header from "../components/headers/Header.js";
import ConflictForm from "../components/forms/ConflictForm.js";
import { api } from "/Users/alejandrovillanueva/mcg-apply/client/src/lib/api.js"; // adjust path if needed

export default function ConflictRoute() {
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

        // Block candidates from this page
        if (res?.data?.usertype === "candidate") {
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
      <ConflictForm user={me} />
    </div>
  );
}

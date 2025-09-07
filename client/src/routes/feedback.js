// client/src/routes/Feedback.js  (rename file if you want; current export was "Events")
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import Header from "../components/headers/Header.js";
import FeedbackForm from "../components/forms/FeedbackForm.js";
import { api } from "../lib/api.js";

export default function Feedback() {
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
    <div>
      <Header
        firstname={me.firstname}
        usertype={me.usertype}
        headshot={me.headshot}
      />
      <FeedbackForm />
    </div>
  );
}

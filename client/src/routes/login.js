import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import LoginForm from "../components/forms/LoginForm.js";
import { api } from "../lib/api.js";

export default function Login() {
  const history = useHistory();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        await api("/me", { signal: controller.signal, cache: "no-store" });
        if (!alive) return;
        history.push("/events");
      } catch {
        // not authenticated → show the form
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; controller.abort(); };
  }, [history]);

  if (loading) return null;

  // 👇 This is the important part
  return <LoginForm onSuccess={() => history.push("/profile?first=1")} />;
}

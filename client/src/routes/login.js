// client/src/routes/login.js
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { api } from "../lib/api.js";
import LoginForm from "../components/forms/LoginForm.js";
import { routeAfterAuth } from "../lib/routeAfterAuth.js";

export default function Login() {
  const history = useHistory();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    (async () => {
      try {
        await api("/me", { signal: controller.signal });
        if (!alive) return;
        await routeAfterAuth(history);
      } catch {
        // not logged in → show the form
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; controller.abort(); };
  }, [history]);

  if (loading) return null;
  return <LoginForm onSuccess={() => routeAfterAuth(history)} />;
}

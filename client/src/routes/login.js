// client/src/routes/login.js
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
    q45
    (async () => {
      try {
        await api("/me", { signal: controller.signal }); // will include cookies
        if (!alive) return;
        history.push("/events"); // already logged in
      } catch {
        // not authenticated → show the form
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
  return <LoginForm />;
}

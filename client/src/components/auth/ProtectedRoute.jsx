// client/src/components/auth/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Route, Redirect } from "react-router-dom";
import { api } from "/Users/alejandrovillanueva/mcg-apply/client/src/lib/api.js";

export default function ProtectedRoute({ component: Component, ...rest }) {
  const [loading, setLoading] = useState(true);
  const [allow, setAllow] = useState(false);

//   useEffect(() => {
//     fetch("/api/me", { credentials: "include" })
//       .then(r => setAllow(r.ok))
//       .finally(() => setLoading(false));
//   }, []);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        // api() already adds credentials: "include"
        await api("/me", { signal: controller.signal });
        if (alive) setAllow(true);
      } catch (_e) {
        // If /me fails (401/403/whatever), don't allow
        if (alive) setAllow(false);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  if (loading) return null;
  return (
    <Route
      {...rest}
      render={(props) => (allow ? <Component {...props} /> : <Redirect to="/login" />)}
    />
  );
}

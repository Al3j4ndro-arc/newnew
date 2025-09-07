// client/src/routes/onboarding.js
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import OnboardingFlow from "../components/OnboardingFlow.jsx";
import { api } from "/Users/alejandrovillanueva/mcg-apply/client/src/lib/api.js"; // ← helper that includes credentials: "include"

export default function Onboarding() {
  const history = useHistory();
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        const { data } = await api("/me", { signal: controller.signal }); // sends cookies
        if (!alive) return;

        // If onboarding already completed (internal headshot present), bounce
        if (data.internalHeadshot || data.onboardingCompleteAt) {
          history.push("/events");
          return;
        }

        setUser(data);
      } catch {
        if (alive) history.push("/login"); // not authenticated
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [history]);

  if (loading || !user) return null;

  return (
    <OnboardingFlow
      user={user}
      onDone={() => history.push("/events")}
    />
  );
}

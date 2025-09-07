// client/src/components/auth/GoogleButton.jsx
import React, { useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { routeAfterAuth } from "../../lib/routeAfterAuth.js";

const clientId = process.env.GOOGLE_CLIENT_ID;

function loadGis() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();

    const src = "https://accounts.google.com/gsi/client";
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function GoogleButton({ text = "continue_with" }) {
  const divRef = useRef(null);
  const history = useHistory();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (!clientId) {
          console.error("GOOGLE_CLIENT_ID is missing");
          return;
        }
        await loadGis();
        if (cancelled) return;

        async function handleCredentialResponse(resp) {
          const id_token = resp.credential;
          try {
            const r = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ id_token }),
            });
            if (!r.ok) {
              const err = await r.json().catch(() => ({}));
              throw new Error(err.message || `HTTP ${r.status}`);
            }
            await r.json();
            // history.push("/onboarding");
            await routeAfterAuth(history);
          } catch (e) {
            console.error("Google sign-in failed:", e);
            alert(e.message || "Google sign-in failed");
          }
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          ux_mode: "popup",
        });

        if (divRef.current) {
          window.google.accounts.id.renderButton(divRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            text, // "continue_with" | "signin_with"
            shape: "pill",
            logo_alignment: "left",
          });
        }
        // Optional:
        // window.google.accounts.id.prompt();
      } catch (e) {
        console.error("Failed to load Google Identity Services", e);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  return <div ref={divRef} />;
}

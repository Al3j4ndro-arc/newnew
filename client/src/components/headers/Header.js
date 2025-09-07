// Header.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function Header({ firstname, usertype, headshot }) {
  const [navbarOpen, setNavbarOpen] = useState(false);

  const avatarUrl = useMemo(() => {
    if (!headshot || typeof headshot !== "string" || !headshot.trim()) return null;

    const v = headshot.trim();

    // Already a data URL or full http(s) URL
    if (v.startsWith("data:image")) return v;
    if (/^https?:\/\//i.test(v)) return v;

    // Otherwise treat as an S3 key like "headshots/uuid.png"
    const CDN =
      import.meta.env.VITE_CDN_DOMAIN // e.g. https://dXXXX.cloudfront.net
      || "https://mcg-apps-data.s3.us-east-2.amazonaws.com";
    return `${CDN}/${v.replace(/^\/+/, "")}`;
  }, [headshot]);

  console.log("headshot prop ->", headshot);
  console.log("avatarUrl ->", avatarUrl);

  const UserBadge = (
    <div className="flex items-center gap-3 pl-3 pr-4">
      <span className="text-gray-900">Hi {firstname}</span>

      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${firstname}'s headshot`}
          className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-300 overflow-hidden"
          loading="lazy"
          onError={(e) => {
            // If fetch fails (404/403), fall back to initial bubble
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) fallback.style.display = "flex";
          }}
        />
      ) : null}

      {/* Fallback bubble (initial) — hidden when image loads */}
      <div
        className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center text-sm font-medium text-gray-600"
        style={{ display: avatarUrl ? "none" : "flex" }}
      >
        {(firstname?.[0] || "?").toUpperCase()}
      </div>
    </div>
  );

  return (
    <nav className="text-xl bg-white border-gray-200 relative flex flex-wrap items-center justify-between px-2 py-3 mb-3">
      <div className="container px-4 mx-auto flex flex-wrap items-center justify-between">
        {/* left side trimmed for brevity */}

        <div className={"lg:flex flex-grow items-center" + (navbarOpen ? " flex" : " hidden")}>
          {usertype !== "candidate" ? (
            <ul className="flex flex-col lg:flex-row list-none lg:ml-auto mt-2 lg:mt-0">
              <li className="nav-item"><Link to="/events" className="px-3 py-1 flex items-center"><span className="block pl-3 pr-4 text-gray-900 md:p-0 hover:text-red-700">Events</span></Link></li>
              <li className="nav-item"><Link to="/feedback" className="px-3 py-1 flex items-center"><span className="block pl-3 pr-4 text-gray-900 md:p-0 hover:text-red-700">Feedback</span></Link></li>
              <li className="nav-item"><Link to="/conflict" className="px-3 py-1 flex items-center"><span className="block pl-3 pr-4 text-gray-900 md:p-0 hover:text-red-700">Conflict</span></Link></li>
              <li className="nav-item"><Link to="/logout" className="px-3 py-1 flex items-center"><span className="block pl-3 pr-4 text-gray-900 md:p-0 hover:text-red-700">Logout</span></Link></li>
              <li className="nav-item">{UserBadge}</li>
            </ul>
          ) : (
            <ul className="flex flex-col lg:flex-row list-none lg:ml-auto mt-2 lg:mt-0">
              <li className="nav-item"><Link to="/events" className="px-3 py-1 flex items-center"><span className="block pl-3 pr-4 text-gray-900 md:p-0 hover:text-red-700">Events</span></Link></li>
              <li className="nav-item"><Link to="/application" className="px-3 py-1 flex items-center"><span className="block pl-3 pr-4 text-gray-900 md:p-0 hover:text-red-700">Apply</span></Link></li>
              <li className="nav-item"><Link to="/logout" className="px-3 py-1 flex items-center"><span className="block pl-3 pr-4 text-gray-900 md:p-0 hover:text-red-700">Logout</span></Link></li>
              <li className="nav-item">{UserBadge}</li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}

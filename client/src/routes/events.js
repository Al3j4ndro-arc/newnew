import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import Header from "../components/headers/Header.js";
import EventsForm from "../components/forms/EventsForm.js";

export default function Events() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({ firstname: "" });

  const history = useHistory();

  useEffect(() => {
    fetch("/api/me").then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          setUserData(data.data);
          setIsLoading(false);
        });
      } else {
        history.push("/login"); // v5 syntax
      }
    });
  }, [history]); // 👈 use history as the dependency

  return isLoading ? (
    <div></div>
  ) : (
    <div>
      <Header firstname={userData.firstname} usertype={userData.usertype} />
      <div className="bg-gray-50 pb-6">
        <h1 className="pt-8 mb-8 text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
          Welcome to MCG's Fall 2026 Recruitment Cycle Events
        </h1>
        <EventsForm usertype={userData.usertype} />
      </div>
    </div>
  );
}

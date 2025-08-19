import React from "react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import Header from "../components/headers/Header.js";
import FeedbackForm from "../components/forms/FeedbackForm.js";

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
        history.push('/login');
      }
    });
  }, [navigate]);

  return isLoading ? (
    <div></div>
  ) : (
    <div>
      <div>
        <Header firstname={userData.firstname} usertype={userData.usertype} />
      </div>
      <FeedbackForm />
    </div>
  );
}

import React from "react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import LoginForm from "../components/forms/LoginForm.js";

export default function Login() {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }).then((res) => {
      if (res.ok) {
        history.push('/events');
      }
      setIsLoading(false);
    });
  }, [history]);

  return <div>{isLoading ? <div></div> : <LoginForm />}</div>;
}

import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import validator from "validator";

export default function SignUpForm() {
  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const submitSignup = () => {
    if (!validateEmail(email) || !validator.isEmail(email)) {
      setError("Please enter a valid MIT email address");
      return;
    }

    if (!email.endsWith("@mit.edu")) {
      setError("Please enter a valid MIT email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (firstname.length < 1 || lastname.length < 1) {
      setError("First and last name must be at least 1 character long");
      return;
    }

    if (!validator.isAlpha(firstname) || !validator.isAlpha(lastname)) {
      setError("First and last name must only contain letters");
      return;
    }


    const url = "/api/auth/signup";
    const data = { firstname, lastname, email, password };
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    };

    fetch(url, options)
      .then((res) => {
        if (res.ok) {
          navigate("/events");
        }
        else {
          res.json().then((data) => {
            setError(data.message);
          })
        }
      })

  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          First Name
        </label>
        <input
          type="firstname"
          name="firstname"
          id="firstname"
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
          placeholder=""
          required=""
          value={firstname}
          onChange={(e) => {
            setError("");
            setFirstName(e.target.value);
          }}
        />
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Last Name
        </label>
        <input
          type="lastname"
          name="lastname"
          id="lastname"
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
          placeholder=""
          required=""
          onChange={(e) => {
            setError("");
            setLastName(e.target.value);
          }}
        />
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Your email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
          placeholder="kerb@mit.edu"
          required=""
          onChange={(e) => {
            setError("");
            setEmail(e.target.value);
          }}
        />
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          placeholder="••••••••"
          className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
          required=""
          onChange={(e) => {
            setError("");
            setPassword(e.target.value);
          }}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              submitSignup();
            }
          }}
        />
      </div>
      <button
        onClick={submitSignup}
        className="text-sm h-10 px-5 text-white transition-colors duration-150 bg-red-700 rounded-lg focus:shadow-outline hover:bg-red-800"
      >
        Sign Up
      </button>
      <p className="text-red-500">{error.capitalize()}</p>
      <p className="text-sm font-light text-gray-500">
        Already have an account?{" "}
        <a
          href="/login"
          className="font-medium text-primary-600 hover:underline"
        >
          Login
        </a>
      </p>
    </div>
  );
}

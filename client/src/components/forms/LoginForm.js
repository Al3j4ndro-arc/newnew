import React from "react";
import PublicHeader from "../headers/PublicHeader";
import { useNavigate } from "react-router";
import { useState } from "react";
import validator from "validator";

Object.defineProperty(String.prototype, "capitalize", {
    value: function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    },
    enumerable: false,
});

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const submitLogin = () => {

        if (!validator.isEmail(email)) {
            setError("please enter a valid email");
            return;
        }

        const url = "/api/auth/login";
        const data = { email, password };
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(data),
        };

        fetch(url, options).then((res) => {
            if (res.ok) {
                navigate("/events");
            } else {
                res.json().then((err) => {
                    setError(err.message);
                });
            }
        });
    };

    return (
        <div className="bg-gray-50">
            <div>
                <PublicHeader />
            </div>
            <div className="flex flex-col items-center justify-center px-6 mx-auto md:h-screen lg:py-0">
                <div className="mb-4 w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0 ">
                    <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-xl font-bold text-center leading-tight tracking-tight text-gray-900">
                            Login
                        </h1>
                        <div className="space-y-4 md:space-y-6">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900">
                                    Your email:{" "}
                                </label>
                                <input
                                    onChange={(e) => {
                                        setError("");
                                        setEmail(e.target.value);
                                    }}
                                    type="email"
                                    name="email"
                                    id="email"
                                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                                    placeholder="kerb@mit.edu"
                                    required=""
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 ">
                                    Password:
                                </label>
                                <input
                                    onChange={(e) => {
                                        setError("");
                                        setPassword(e.target.value);
                                    }}
                                    onKeyUp={(e) => {
                                        if (e.key === "Enter") {
                                            submitLogin();
                                        }
                                    }}
                                    type="password"
                                    name="password"
                                    id="password"
                                    placeholder="••••••••"
                                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                                    required=""
                                />
                            </div>
                            <button
                                onClick={submitLogin}
                                className="text-sm h-10 px-5 text-white transition-colors duration-150 bg-red-700 rounded-lg focus:shadow-outline hover:bg-red-800"
                            >
                                Login
                            </button>
                            <p className="text-red-500">{error.capitalize()}</p>
                            <p className="text-sm font-light text-gray-500 ">
                                Don't have an account yet?{" "}
                                <a
                                    href="/signup"
                                    className="font-medium text-primary-600 hover:underline"
                                >
                                    Sign up
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

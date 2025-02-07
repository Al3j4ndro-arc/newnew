import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import PublicHeader from "../components/headers/PublicHeader";

export default function Logout() {
    const navigate = useNavigate();

    function clearToken() {
        const url = `/api/auth/logout`;

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        };

        fetch(url, options).then((res) => {
            if (res.ok) {
                navigate("/login");
            } else {
                navigate("/login");
            }
        });
    }

    useEffect(() => {
        if (global.window) {
            clearToken();
        }
    });

    return (
        <div>
            <PublicHeader />
            <div className="flex flex-col items-center justify-center px-6 mx-auto md:h-screen lg:py-0">
                <div className="w-full bg-white rounded-lg shadow  md:mt-0 sm:max-w-md xl:p-0">
                    <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-xl font-bold text-center leading-tight tracking-tight text-gray-900">
                            Logging out...
                        </h1>
                    </div>
                </div>
            </div>
        </div>
    );
}

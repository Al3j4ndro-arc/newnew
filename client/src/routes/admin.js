import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import Header from '../components/headers/Header';
import AdminPanel from '../components/forms/AdminForm';

export default function Admin() {
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState({ firstname: "" });

    const navigate = useNavigate();

    useEffect(() => {
        fetch("/api/me").then(
            (response) => {
                if (response.ok) {
                    response.json().then(data => {
                        if (data.data.usertype !== "admin") {
                            navigate("/login")
                        }
                        else {
                            setUserData(data.data);
                            setIsLoading(false);
                        }
                    })
                }
                else {
                    navigate("/login")
                }
            }
        )
    }, [navigate]);
    return (
        isLoading ? <div></div> :
            <div>
                <div>
                    <Header firstname={userData.firstname} usertype={userData.usertype} />
                </div>

                <div className="flex flex-col items-center justify-center px-6 mx-auto md:h-screen lg:py-0">
                    <div className="mb-4 w-full bg-white rounded-lg shadow  md:mt-0 sm:max-w-md xl:p-0">
                        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                            <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                                Admin Panel
                            </h1>
                            <AdminPanel />
                        </div>
                    </div>
                </div>
            </div>
    )
}
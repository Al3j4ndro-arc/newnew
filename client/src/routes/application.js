import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import Header from '../components/headers/Header';
import ApplicationForm from '../components/forms/ApplicationForm';

export default function Application() {
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState({});

    const navigate = useNavigate();

    useEffect(() => {
        fetch("/api/me").then(
            (response) => {
                if (response.ok) {
                    response.json().then(data => {
                        setUserData(data.data);
                        setIsLoading(false);
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
            <div className="bg-gray-50">
                <div>
                    <Header firstname={userData.firstname} usertype={userData.usertype} />
                </div>
                <div className="flex flex-col items-center justify-center py-8 ">
                    <div className="w-full bg-white rounded-lg shadow  md:mt-0 sm:max-w-2xl lg:max-w-4xl xl:p-0 ">
                        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                            <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                                MCG Spring 2025 Application
                            </h1>
                            <ApplicationForm />
                        </div>
                    </div>
                </div>
            </div>
    )
}

import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import Header from '../components/headers/Header';
import EventsForm from '../components/forms/EventsForm';

export default function Events() {
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState({ firstname: "" });

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
            <div>
                <div>
                    <Header firstname={userData.firstname} usertype={userData.usertype} />
                </div>

                <div className="bg-gray-50 pb-6">
                    <h1 className="pt-8 mb-8 text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                        Welcome to MCG's Fall 2025 Recruitment Cycle Events
                    </h1>
                    <EventsForm usertype={userData.usertype} />

                </div>
            </div>
    )
}

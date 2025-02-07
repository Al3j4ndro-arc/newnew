import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import Header from '../components/headers/Header';
import ConflictForm from '../components/forms/ConflictForm';

export default function Events() {
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState({ firstname: "" });

    const navigate = useNavigate();

    useEffect(() => {
        fetch("/api/me").then(
            (response) => {
                if (response.ok) {
                    response.json().then(data => {
                        if (data.data.usertype == "candidate") {
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
                <ConflictForm user={userData} />
            </div>
    )
}
import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function AdminPanel() {
    const [eventID, setEventID] = useState("");
    const [eventCode, setEventCode] = useState("");
    const [error, setError] = useState("");

    const [allCodes, setAllCodes] = useState({});

    const navigate = useNavigate();

    const getEventCodes = () => {
        fetch("/api/admin/get-event-codes", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        }).then((res) => {
            if (!res.ok) {
                navigate("/login");
            } else {
                res.json().then((data) => {
                    setAllCodes(data.eventCodes);
                });
            }
        });
    }

    const publishEventCode = () => {
        if (!eventID || !eventCode) {
            setError("Please fill out all fields");
            return;
        }
        let data = {
            eventName: eventID,
            eventCode: eventCode,
        };
        fetch("/api/admin/set-event-code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(data),
        }).then((res) => {
            if (res.ok) {
                setEventID("");
                setEventCode("");
                setError("");
                getEventCodes();
            } else {
                setError("Error publishing event code");
            }
        });
    };

    useEffect(() => {
        getEventCodes();
    }, [navigate]);

    return (
        <div>
            <div className="space-y-4 md:space-y-6">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                        Event ID
                    </label>
                    <input
                        className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                        value={eventID}
                        onChange={(e) => {
                            setError("");
                            setEventID(e.target.value);
                        }}
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                        Event Code
                    </label>
                    <input
                        className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                        placeholder=""
                        value={eventCode}
                        onChange={(e) => {
                            setError("");
                            setEventCode(e.target.value);
                        }}
                    />
                </div>

                <button
                    onClick={publishEventCode}
                    className="text-sm h-10 px-5 text-white transition-colors duration-150 bg-red-700 rounded-lg focus:shadow-outline hover:bg-red-800"
                >
                    Set Event Code
                </button>
                <p className="text-red-500">{error.capitalize()}</p>
                <div>
                    <label className="block mb-2 font-medium text-gray-900">
                        All Event Codes:
                    </label>
                    {Object.keys(allCodes).length > 0 ? Object.keys(allCodes).map((key) => {
                        return (
                            <div key={key} className="flex space-x-4">
                                <p className="text-gray-900">{key}</p>
                                <p className="text-gray-900">{allCodes[key]}</p>
                            </div>
                        );
                    }) : <p className="text-sm">No Event Codes Set</p>}
                </div>
            </div>
        </div>
    );
}

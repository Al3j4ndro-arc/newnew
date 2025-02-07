import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import validator from "validator";

export default function EventCheckInForm({ event }) {
    const { id, name, timelocation, description } = event;
    const [checkInCode, setCheckInCode] = useState("");
    const [correctCode, setCorrectCode] = useState(false);
    const [wrongCode, setWrongCode] = useState(false);

    const navigate = useNavigate();

    const sendCheckInCode = () => {
        if (checkInCode.length < 1) {
            return;
        }
        if (!validator.isAlphanumeric(checkInCode)) {
            setWrongCode(true);
            return;
        }
        let data = {
            eventName: id,
            eventCode: checkInCode,
        };
        fetch("/api/events/event-signin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(data),
        }).then((res) => {
            if (res.ok) {
                setCorrectCode(true);
                setCheckInCode("Checked In");
            } else {
                setWrongCode(true);
            }
        });
    };

    useEffect(() => {
        fetch("/api/me", {
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
                    if (data.data.userData.events && data.data.userData.events[id]) {
                        setCheckInCode("Checked In");
                        setCorrectCode(true);
                    }
                });
            }
        });
    });

    return (
        <div className="max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow">
            <div className="">
                <a href="#">
                    <h5 className=" text-center mb-2 text-2xl font-bold tracking-tight text-gray-900">
                        {name}
                    </h5>
                </a>
                <p className=" text-center mb-3 font-normal text-gray-700 ">
                    {timelocation}
                </p>
                <p className="mb-3 font-normal text-gray-700 ">
                    {description}
                </p>
            </div>

            <div className="space-y-3">
                <div>
                    <input
                        disabled={correctCode}
                        type="text"
                        className={`${correctCode
                            ? "bg-green-400"
                            : wrongCode
                                ? "bg-red-400"
                                : "bg-gray-50 border-gray-300"
                            } border  text-gray-900 text-sm rounded-lg block w-full p-2.5 `}
                        placeholder="Check in Code"
                        onChange={(e) => {
                            setWrongCode(false)
                            setCheckInCode(e.target.value)
                        }
                        }
                        value={checkInCode}
                    />
                </div>
                {correctCode ? (
                    ""
                ) : (
                    <button
                        disabled={correctCode}
                        onClick={sendCheckInCode}
                        className="w-full text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                    >
                        Check-In To Event
                    </button>
                )}
            </div>
        </div>
    );
}

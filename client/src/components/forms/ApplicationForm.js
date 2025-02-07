import React from "react";
import { useState, useEffect } from "react";
import validator from "validator";

export default function ApplicationForm() {
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [classYear, setClassYear] = useState("");
    const [profileImg, setProfileImg] = useState("");
    const [resume, setResume] = useState("");
    const [opt1, setOpt1] = useState("");
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [open, setopen] = useState(false);

    useEffect(() => {
        fetch("/api/application/get-application")
            .then((res) => res.json())
            .then((result) => {
                if (result.application) {
                    setFirstname(result.application.firstname ? result.application.firstname : "");
                    setLastname(result.application.lastname ? result.application.lastname : "");
                    setEmail(result.application.email ? result.application.email : "");
                    setClassYear(result.application.classYear ? result.application.classYear : "");
                    setProfileImg(result.application.profileImg ? result.application.profileImg : "");
                    setResume(result.application.resume ? result.application.resume : "");
                    setOpt1(result.application.opt1 ? result.application.opt1 : "");
                }
            })
            .catch((err) => {
            });
    }, []);

    const submitApplication = () => {
        if (
            firstname === "" ||
            lastname === "" ||
            classYear === "" ||
            resume === "" ||
            email == ""
        ) {
            setError("Please fill out all required fields");
            return;
        }
        if (!validator.isEmail(email)) {
            setError("Please enter a valid email address");
            return;
        }
        if (!email.endsWith("@mit.edu")) {
            setError("Please enter a valid MIT email address");
            return;
        }
        // check that first and last name is letters
        if (!validator.isAlpha(firstname) || !validator.isAlpha(lastname)) {
            setError("Please only enter letters for first and last name");
            return;
        }
        // check that class year is a number
        if (!validator.isNumeric(classYear)) {
            setError("Please enter a valid class year, such as 2027");
            return;
        }
        fetch("/api/application/submit-application", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                firstname: firstname,
                lastname: lastname,
                email: email,
                classYear: classYear,
                profileImg: profileImg,
                resume: resume,
                opt1: opt1,
            }),
        })
            .then((res) => {
                if (res.ok) {
                    setSubmitted(true);
                }
                else {
                    res.json().then(
                        (result) => {
                            setError(result.message);
                        }
                    )
                }
            }
            )
            .catch((err) => {
                setError(err.message);
            });

    };

    const handleProfileUpload = (file) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setProfileImg(reader.result);
        };
    };

    const handleResumeUpload = (file) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setResume(reader.result);
        };
    };

    return (
        !open ? <div className="space-y-4 md:space-y-6">
            <div>
                <h3>
                    Our application for the Spring 2025 cycle is closed.
                    <br></br>
                    <br></br>
                    If you have any questions or concerns,
                    please reach out to Alejandro Villanueva (
                    <a className="hover:text-blue-600" href="mailto:ale12@mit.edu">ale12@mit.edu</a>).
                </h3>
            </div>
        </div>
            :
            <div className="space-y-4 md:space-y-6">
                <div>
                    <h3>
                        You can submit your application as many times as you'd like before the
                        application deadline. We will only consider your most recent
                        submission. Be sure to press the submit button at the bottom of the
                        page when you are done or want to save your answers!
                        <br></br>
                        <br></br>
                        If you have any technical difficulties,
                        please reach out to Alejandro Villanueva (
                        <a className="hover:text-blue-600" href="mailto:ale12@mit.edu">ale12@mit.edu</a>).
                    </h3>
                </div>
                <div>
                    <label
                        className="block mb-2 text-sm font-medium text-gray-900"
                    >
                        First Name
                    </label>
                    <input
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                        value={firstname}
                        onChange={(e) => {
                            setError("");
                            setFirstname(e.target.value);
                        }}
                    />
                </div>
                <div>
                    <label
                        className="block mb-2 text-sm font-medium text-gray-900"
                    >
                        Last Name
                    </label>
                    <input
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                        value={lastname}
                        onChange={(e) => {
                            setError("");
                            setLastname(e.target.value);
                        }}
                    />
                </div>
                <div>
                    <label
                        className="block mb-2 text-sm font-medium text-gray-900"
                    >
                        Your email
                    </label>
                    <input
                        type="email"
                        className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                        placeholder="kerb@mit.edu"
                        value={email}
                        onChange={(e) => {
                            setError("");
                            setEmail(e.target.value);
                        }}
                    />
                </div>
                <div>
                    <label
                        className="block mb-2 text-sm font-medium text-gray-900"
                    >
                        Class Year
                    </label>
                    <input
                        placeholder="Ex: 2027"
                        className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                        value={classYear}
                        onChange={(e) => {
                            setError("");
                            setClassYear(e.target.value);
                        }}
                    />
                </div>
                <div>
                    <label
                        className="block mb-2 text-sm font-medium text-gray-900"
                    >
                        Profile Image
                    </label>
                    <input
                        className="block w-full text-sm font-medium text-gray-900 border border-gray-300 rounded-lg p-1.5 cursor-pointer bg-gray-50 focus:outline-none"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            setError("");
                            handleProfileUpload(e.target.files[0]);
                        }}
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                        Resume Upload
                    </label>
                    <input
                        className="block w-full text-sm font-medium text-gray-900 border border-gray-300 rounded-lg p-1.5 cursor-pointer bg-gray-50 focus:outline-none"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                            setError("");
                            handleResumeUpload(e.target.files[0]);
                        }}
                    />
                </div>

                <div>
                    <label
                        className="block mb-2 text-sm font-medium text-gray-900"
                    >
                        Optional: What do you hope to gain from MCG?
                    </label>
                    <textarea
                        className="p-2 resize-none bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full h-48"
                        value={opt1}
                        onChange={(e) => {
                            setError("");
                            setOpt1(e.target.value);
                        }}
                    />
                </div>

                <button
                    onClick={submitApplication}
                    className="text-sm h-10 px-5 text-white transition-colors duration-150 bg-red-700 rounded-lg focus:shadow-outline hover:bg-red-800"
                >
                    Submit Application
                </button>
                {submitted ? <p className="text-green-500">Submitted successfully!</p> : ""}
                <p className="text-red-500">{error.capitalize()}</p>
            </div>
    );
}

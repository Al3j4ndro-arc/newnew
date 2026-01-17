import React from 'react';
import PublicHeader from '../components/headers/PublicHeader.js';
import { Link } from 'react-router-dom';

export default function PublicEvents() {
    const [open, setOpen] = React.useState(false);
    const events = [
        {
        id: "hellomcg",
        name: "Meet the Team",
        timelocation: "7:30 - 9pm | Monday 9/8 | Room W20-201",
        description:
            "Meet current members of MCG and learn more about MCG's recruitment process during our first recruitment event of the semester.",
        },
        {
        id: "careerday",
        name: "Career Day",
        timelocation: "7:30 - 9pm | Tuesday 9/9 | Room 2-131",
        description:
            "Hear from current members about their professional experiences in various industries and the role MCG has played in developing their careers.",
        },
        {
        id: "allvoices",
        name: "DEI Panel",
        timelocation: "7:30 - 9pm | Wednesday 9/10 | Room 2-190",
        description:
            "Hear from current women and BIPOC within MCG about their professional experiences and MCG's efforts to create a more inclusive environment.",
        },
        {
        id: "resume_glowup",
        name: "Resume Review",
        timelocation: " 7:30 - 9pm | Thursday 9/11 | Room 2-190",
        description:
            "Come work on your resume with the help of current MCG consultants who have landed offers at top consulting, finance, and tech companies.",
        },
        {
        id: "dessert",
        name: "Cheesecake Social",
        timelocation: "7:30 - 9pm | Friday 9/12 | By Invitation",
        description:
            "Join us for a night of cheesecake and games and learn more about the MCG community, social events, and the work our members do in a casual setting.",
        },
        {
        id: "caseprep",
        name: "Case Workshop",
        timelocation: "12:30 - 2pm | Saturday 9/13 | By Invitation",
        description:
            "Learn more about consulting and prepare for MCG interviews by working through a mock case with MCG consultants.",
        },
    ];
    return (
        <div>
            <div>
                <PublicHeader />

            </div>

            <div className="bg-gray-50 ">
                <div className='text-center'>
                    <h1 className="pt-8 text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                        Welcome to MCG's Spring 2026 Recruitment Cycle Events
                    </h1>
                    <h3 className="my-4">
                        Please{" "}
                        <span
                            className="relative inline-block"
                            onMouseEnter={() => setOpen(true)}
                            onMouseLeave={() => setOpen(false)}
                            onFocus={() => setOpen(true)}
                            onBlur={() => setOpen(false)}
                        >
                            <Link to="/login" className="font-bold underline underline-offset-2">
                            login
                            </Link>

                            {open && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                                <div className="p-2 bg-white border rounded-xl shadow-lg">
                                <img
                                    src="/preview-login.png"
                                    alt="Login preview"
                                    className="w-32 h-auto rounded-md shadow-md"
                                />
                                </div>
                            </div>
                            )}
                        </span>{" "}
                        to check-in to events
                    </h3>
                </div>

                <div className="flex flex-wrap gap-8 px-10 justify-center">
                    {events.map((event) => (
                        <div key={event.id} className="max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow ">
                            <div className="">
                                <h5 className=" text-center mb-2 text-2xl font-bold tracking-tight text-gray-900 ">{event.name}</h5>
                                <p className=" text-center mb-3 font-normal text-gray-700">{event.timelocation}</p>
                                <p className="mb-3 font-normal text-gray-700 ">{event.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
